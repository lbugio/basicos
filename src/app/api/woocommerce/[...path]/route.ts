import { NextRequest, NextResponse } from "next/server";
import OAuth from "oauth-1.0a";
import CryptoJS from "crypto-js";

// Server-only WooCommerce credentials. These must NOT be prefixed with
// NEXT_PUBLIC_ so they never reach the browser bundle.
const STORE_URL = process.env.WOOCOMMERCE_STORE_URL || "";
const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY || "";
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET || "";

const isConfigured = () => !!(STORE_URL && CONSUMER_KEY && CONSUMER_SECRET);

const oauth = new OAuth({
  consumer: { key: CONSUMER_KEY, secret: CONSUMER_SECRET },
  signature_method: "HMAC-SHA1",
  hash_function(base_string, key) {
    return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
  },
});

// Each path segment must be a plain identifier — no traversal ("..", "."),
// no slashes, no encoded characters. This blocks path traversal and stops the
// proxy from being redirected to arbitrary upstream paths.
const SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/;

function validateSegments(pathSegments: string[]): boolean {
  return pathSegments.every((seg) => SAFE_SEGMENT.test(seg));
}

// A product id segment must be purely numeric. This stops the GET allowlist
// from being abused to reach sibling collection endpoints like
// /products/reviews, /products/categories, etc.
const NUMERIC_ID = /^[0-9]+$/;

// Allowlist of what the (unauthenticated) storefront is permitted to proxy.
// This API route has no auth layer, so it must not expose privileged
// WooCommerce endpoints. We allow:
//   - reading the public catalogue (products / variations)
//   - creating a new order (checkout)
// Everything else — listing/reading orders, anything under /customers,
// reports, settings, etc. — is rejected so the server credentials cannot be
// abused to exfiltrate customer PII or tamper with existing orders.
function isAllowed(method: string, pathSegments: string[]): boolean {
  const [resource, id, sub] = pathSegments;

  if (method === "GET") {
    // /products                       -> list catalogue
    // /products/{numericId}           -> single product
    // /products/{numericId}/variations
    if (resource === "products") {
      if (pathSegments.length === 1) return true;
      if (pathSegments.length === 2) return NUMERIC_ID.test(id);
      if (pathSegments.length === 3)
        return NUMERIC_ID.test(id) && sub === "variations";
      return false;
    }
    return false;
  }

  if (method === "POST") {
    // Order creation only: /orders (no id => create, not mutate existing).
    return resource === "orders" && pathSegments.length === 1;
  }

  // No PUT/DELETE through the public proxy.
  return false;
}

// For GET /products we only let a small set of query keys through. WooCommerce
// otherwise lets callers flip `status` to `draft`/`private` or page through the
// whole catalogue with arbitrary filters. We also force status=publish so the
// proxy can never surface unpublished products.
const ALLOWED_PRODUCT_QUERY_KEYS = new Set([
  "page",
  "per_page",
  "search",
  "category",
  "tag",
  "slug",
  "orderby",
  "order",
  "on_sale",
  "featured",
  "include",
  "exclude",
]);

function buildSafeSearch(
  req: NextRequest,
  pathSegments: string[]
): string {
  // Only product listings get query params; everything else is sent clean.
  if (pathSegments[0] !== "products") return "";

  const incoming = req.nextUrl.searchParams;
  const safe = new URLSearchParams();
  for (const [key, value] of incoming) {
    if (ALLOWED_PRODUCT_QUERY_KEYS.has(key)) safe.append(key, value);
  }
  // Never allow the caller to choose product status.
  safe.set("status", "publish");

  const qs = safe.toString();
  return qs ? `?${qs}` : "";
}

// Rebuild the order body server-side from a strict allowlist. We never forward
// the client's raw JSON, because an attacker hitting this endpoint directly
// could set `set_paid: true`, zero out `total`, inject coupon/fee lines, or
// override per-line-item prices to obtain free or discounted goods.
function buildSafeOrderBody(raw: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const input = parsed as Record<string, unknown>;

  const items = Array.isArray(input.line_items) ? input.line_items : [];
  const line_items = items
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      const it = item as Record<string, unknown>;
      const product_id = Number(it.product_id);
      const quantity = Number(it.quantity);
      if (!Number.isInteger(product_id) || product_id <= 0) return null;
      if (!Number.isInteger(quantity) || quantity <= 0) return null;

      // Only id, quantity and (optionally) variation_id + non-priced meta.
      const safeItem: Record<string, unknown> = { product_id, quantity };
      const variation_id = Number(it.variation_id);
      if (Number.isInteger(variation_id) && variation_id > 0) {
        safeItem.variation_id = variation_id;
      }
      if (Array.isArray(it.meta_data)) {
        safeItem.meta_data = it.meta_data
          .filter(
            (m): m is Record<string, unknown> =>
              typeof m === "object" && m !== null
          )
          .map((m) => ({
            key: String(m.key ?? "attribute"),
            value: String(m.value ?? ""),
          }));
      }
      return safeItem;
    })
    .filter((x): x is Record<string, unknown> => x !== null);

  if (line_items.length === 0) return null;

  // Whitelisted string fields. We deliberately omit `status`, `total`,
  // `transaction_id`, `fee_lines`, `coupon_lines` and top-level `meta_data`.
  const pickString = (v: unknown) => (typeof v === "string" ? v : undefined);

  const order: Record<string, unknown> = {
    set_paid: false, // hard-coded: payment confirmation never comes from client
    payment_method: pickString(input.payment_method) ?? "cod",
    payment_method_title:
      pickString(input.payment_method_title) ?? "Contra reembolso",
    line_items,
  };

  // billing / shipping: pass through only a fixed set of address fields.
  const addressKeys = [
    "first_name",
    "last_name",
    "company",
    "address_1",
    "address_2",
    "city",
    "state",
    "postcode",
    "country",
    "email",
    "phone",
  ];
  const pickAddress = (v: unknown) => {
    if (typeof v !== "object" || v === null) return undefined;
    const src = v as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const k of addressKeys) {
      if (typeof src[k] === "string") out[k] = src[k] as string;
    }
    return out;
  };
  const billing = pickAddress(input.billing);
  const shipping = pickAddress(input.shipping);
  if (billing) order.billing = billing;
  if (shipping) order.shipping = shipping;

  const customer_note = pickString(input.customer_note);
  if (customer_note) order.customer_note = customer_note;

  return JSON.stringify(order);
}

// Build the upstream WooCommerce URL from the proxied path + a sanitized query
// string (see buildSafeSearch — we do not forward req.nextUrl.search raw).
function buildUpstreamUrl(req: NextRequest, pathSegments: string[]): string {
  const path = pathSegments.join("/");
  const search = buildSafeSearch(req, pathSegments);
  return `${STORE_URL}/wp-json/wc/v3/${path}${search}`;
}

async function proxy(
  req: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "WooCommerce is not configured on the server" },
      { status: 503 }
    );
  }

  const method = req.method;

  if (!validateSegments(pathSegments)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!isAllowed(method, pathSegments)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const url = buildUpstreamUrl(req, pathSegments);

  // Sign the request URL with OAuth 1.0a. The JSON body is intentionally not
  // part of the signature (matches WooCommerce's documented behaviour when
  // credentials are passed via the Authorization header).
  const authorization = oauth.authorize({ url, method });
  const authHeader = oauth.toHeader(authorization);

  // Order creation is the only write path. Never forward the raw client body —
  // rebuild it from a strict allowlist so it cannot tamper with payment/pricing.
  let body: string | undefined;
  const hasBody = method !== "GET" && method !== "HEAD";
  if (hasBody) {
    const raw = await req.text();
    const safe = buildSafeOrderBody(raw);
    if (safe === null) {
      return NextResponse.json(
        { error: "Invalid order payload" },
        { status: 400 }
      );
    }
    body = safe;
  }

  try {
    const upstream = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader.Authorization,
      },
      body,
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("WooCommerce proxy error:", error);
    return NextResponse.json(
      { error: "Failed to reach WooCommerce store" },
      { status: 502 }
    );
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
