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

// Allowlist of what the (unauthenticated) storefront is permitted to proxy.
// This API route has no auth layer, so it must not expose privileged
// WooCommerce endpoints. We allow:
//   - reading the public catalogue (products / variations)
//   - creating a new order (checkout)
// Everything else — listing/reading orders, anything under /customers,
// reports, settings, etc. — is rejected so the server credentials cannot be
// abused to exfiltrate customer PII or tamper with existing orders.
function isAllowed(method: string, pathSegments: string[]): boolean {
  const [resource, , sub] = pathSegments;

  if (method === "GET") {
    // /products, /products/{id}, /products/{id}/variations
    if (resource === "products") {
      return (
        pathSegments.length <= 2 ||
        (pathSegments.length === 3 && sub === "variations")
      );
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

// Build the upstream WooCommerce URL from the proxied path + query string.
function buildUpstreamUrl(req: NextRequest, pathSegments: string[]): string {
  const path = pathSegments.join("/");
  const search = req.nextUrl.search; // includes leading "?" or ""
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

  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await req.text() : undefined;

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
