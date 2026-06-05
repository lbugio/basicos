import {
  google,
  type GoogleLanguageModelInteractionsOptions,
} from "@ai-sdk/google";
import { generateText } from "ai";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;
const GENERATION_TIMEOUT_MS = 120_000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const TRY_ON_MODEL =
  process.env.TRY_ON_MODEL?.replace(/^google\//, "") ||
  "gemini-2.5-flash-image";

type RateLimitBucket = { count: number; resetAt: number };
type ParsedInput = {
  userImageBytes: Uint8Array;
  userImageType: string;
  garmentImageUrl: string;
  productName?: string;
  color?: string;
  size?: string;
};

const buckets = new Map<string, RateLimitBucket>();

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function clientKey(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

function checkRateLimit(req: NextRequest): boolean {
  const key = clientKey(req);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count += 1;
  return true;
}

function isPrivateIPv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function isPrivateIPv6(address: string): boolean {
  const normalized = address.toLowerCase();
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIpv4) return isPrivateIPv4(mappedIpv4);

  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("URL de prenda inválida");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("La URL de prenda debe ser http o https");
  }
  if (url.username || url.password) {
    throw new Error("La URL de prenda no puede incluir credenciales");
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("La URL de prenda no puede apuntar a localhost");
  }

  const hostIpType = isIP(hostname);
  const addresses = hostIpType
    ? [{ address: hostname, family: hostIpType }]
    : await lookup(hostname, { all: true, verbatim: true });

  const unsafe = addresses.some((entry) =>
    entry.family === 4
      ? isPrivateIPv4(entry.address)
      : isPrivateIPv6(entry.address)
  );
  if (unsafe || addresses.length === 0) {
    throw new Error("La URL de prenda no es un origen público permitido");
  }

  return url;
}

function validateImageType(mediaType: string | null): string {
  const normalized = mediaType?.split(";")[0]?.trim().toLowerCase() || "";
  if (!ALLOWED_IMAGE_TYPES.has(normalized)) {
    throw new Error("Formato de imagen no soportado");
  }
  return normalized;
}

async function readResponseBytes(response: Response): Promise<Uint8Array> {
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_IMAGE_BYTES) {
    throw new Error("La imagen de la prenda supera el tamaño permitido");
  }
  if (!response.body) {
    throw new Error("No se pudo leer la imagen de la prenda");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_IMAGE_BYTES) {
      reader.cancel();
      throw new Error("La imagen de la prenda supera el tamaño permitido");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function fetchWithValidatedRedirects(rawUrl: string): Promise<Response> {
  let url = await assertPublicHttpUrl(rawUrl);

  for (let redirectCount = 0; redirectCount < 3; redirectCount += 1) {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "manual",
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }

    const location = response.headers.get("location");
    if (!location) {
      throw new Error("La imagen de la prenda redirige sin destino válido");
    }
    url = await assertPublicHttpUrl(new URL(location, url).toString());
  }

  throw new Error("La imagen de la prenda redirige demasiadas veces");
}

async function fetchGarmentImage(rawUrl: string) {
  const response = await fetchWithValidatedRedirects(rawUrl);

  if (!response.ok) {
    throw new Error("No se pudo descargar la imagen de la prenda");
  }

  const mediaType = validateImageType(response.headers.get("content-type"));
  const bytes = await readResponseBytes(response);
  return { bytes, mediaType };
}

async function fileToBytes(file: File): Promise<Uint8Array> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new RangeError("La foto supera el tamaño permitido");
  }
  const mediaType = validateImageType(file.type);
  return new Uint8Array(await file.arrayBuffer()).slice(0, file.size);
}

function parseDataUrl(value: string) {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i);
  if (!match) throw new Error("Imagen base64 inválida");
  const mediaType = validateImageType(match[1]);
  const bytes = Uint8Array.from(Buffer.from(match[2], "base64"));
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new RangeError("La foto supera el tamaño permitido");
  }
  return { bytes, mediaType };
}

async function parseInput(req: NextRequest): Promise<ParsedInput> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const userImage = form.get("userImage");
    const garmentImageUrl = String(form.get("garmentImageUrl") || "");

    if (!(userImage instanceof File)) {
      throw new Error("Subí una foto para probarte la prenda");
    }
    if (!garmentImageUrl) {
      throw new Error("Falta la imagen de la prenda");
    }

    const userImageBytes = await fileToBytes(userImage);
    return {
      userImageBytes,
      userImageType: validateImageType(userImage.type),
      garmentImageUrl,
      productName: String(form.get("productName") || "") || undefined,
      color: String(form.get("color") || "") || undefined,
      size: String(form.get("size") || "") || undefined,
    };
  }

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as Record<string, unknown>;
    const userImage = typeof body.userImage === "string" ? body.userImage : "";
    const garmentImageUrl =
      typeof body.garmentImageUrl === "string" ? body.garmentImageUrl : "";
    if (!userImage || !garmentImageUrl) {
      throw new Error("Faltan datos para generar el probador");
    }

    const parsed = parseDataUrl(userImage);
    return {
      userImageBytes: parsed.bytes,
      userImageType: parsed.mediaType,
      garmentImageUrl,
      productName:
        typeof body.productName === "string" ? body.productName : undefined,
      color: typeof body.color === "string" ? body.color : undefined,
      size: typeof body.size === "string" ? body.size : undefined,
    };
  }

  throw new Error("Usá multipart/form-data o application/json");
}

function buildPrompt(input: ParsedInput) {
  // La elección del cliente (color/talle) guía la generación. El píxel de la
  // Imagen 2 sigue mandando sobre la forma/textura de la prenda; el color
  // elegido solo desambigua cuando la prenda existe en varias variantes, y el
  // talle orienta el calce (sin alterar la anatomía real del cliente).
  const colorHint = input.color
    ? `The customer selected the color "${input.color}". If the garment in Image 2 exists in that color, render it in that color; otherwise keep the color shown in Image 2.`
    : "";
  const sizeHint = input.size
    ? `The customer selected size "${input.size}". Reflect that fit naturally on the customer's body (a larger size looser, a smaller size more fitted) without distorting the customer's real body proportions.`
    : "";

  return [
    "Create exactly one realistic virtual try-on image for an ecommerce clothing store.",
    "The garment shape, fabric and print must be inferred only from Image 2. Ignore any person, background, pose or anatomy shown in Image 2.",
    "Before generating, internally isolate the garment from Image 2. Treat Image 2 as a product-reference photo, not as a person-reference photo.",
    "Identify only the garment region in Image 2 and transfer only that garment's visual attributes to Image 1.",
    "Image 1 is the customer. Preserve the customer's face, hair, skin tone, identity, visible body proportions, camera angle, and expression.",
    "Image 2 is only a garment reference. Use it to understand the clothing item: fabric, collar, sleeve length, fit, texture, print, and construction.",
    colorHint,
    sizeHint,
    "Do not copy the model, body, arms, neck, head, skin tone, pose, background, pants, or any person from Image 2.",
    "If Image 2 shows a person wearing the garment, ignore that person's anatomy completely. The source of all human anatomy must be Image 1.",
    "Dress the customer from Image 1 in the garment from Image 2. The final person must still look like the customer from Image 1, not like the product model.",
    "If Image 1 is a close-up or does not show the full torso, extend the customer's shoulders and upper torso naturally and conservatively, matching their visible body, neck, lighting, and camera perspective.",
    "Keep the garment realistic on the customer's body, with natural folds, shadows, and scale. Avoid face changes, identity changes, body swaps, extra limbs, distorted hands, logos that were not present, or text artifacts.",
    "Use a clean neutral studio background and natural ecommerce lighting.",
    "Return only the generated try-on image. Do not include text, captions, before-after layouts, watermarks, or multiple images.",
  ]
    .filter(Boolean)
    .join(" ");
}

function mapAiError(error: unknown) {
  const status =
    typeof error === "object" && error !== null && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode)
      : undefined;
  const message =
    error instanceof Error ? error.message : String(error ?? "");

  if (
    status === 403 &&
    (message.toLowerCase().includes("credit card") ||
      message.toLowerCase().includes("customer_verification_required"))
  ) {
    return {
      status: 402,
      message:
        "Vercel requiere una tarjeta válida para habilitar los créditos de AI Gateway",
    };
  }
  if (
    status === 403 &&
    (message.toLowerCase().includes("free tier users do not have access") ||
      message.toLowerCase().includes("restrictedmodelserror") ||
      message.toLowerCase().includes("no_providers_available"))
  ) {
    return {
      status: 402,
      message:
        "El modelo de IA elegido no está disponible en el free tier de Vercel",
    };
  }

  if (status === 402) {
    return { status: 402, message: "No hay presupuesto disponible para IA" };
  }
  if (status === 429) {
    return { status: 429, message: "Demasiados intentos. Probá de nuevo en unos minutos" };
  }
  if (status === 401 || status === 403) {
    return { status: 503, message: "Gemini no está configurado o no tiene permisos" };
  }

  return { status: 503, message: "No pudimos generar el probador ahora" };
}

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return jsonError("Gemini no está configurado en el servidor", 503);
  }

  if (!checkRateLimit(req)) {
    return jsonError("Demasiados intentos. Probá de nuevo más tarde", 429);
  }

  let input: ParsedInput;
  try {
    input = await parseInput(req);
  } catch (error) {
    const status = error instanceof RangeError ? 413 : 400;
    return jsonError(error instanceof Error ? error.message : "Pedido inválido", status);
  }

  try {
    const garment = await fetchGarmentImage(input.garmentImageUrl);

    const result = await generateText({
      model: google.interactions(TRY_ON_MODEL),
      abortSignal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      providerOptions: {
        google: {
          responseFormat: [{ type: "image" }],
        } satisfies GoogleLanguageModelInteractionsOptions,
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildPrompt(input) },
            {
              type: "file",
              mediaType: input.userImageType,
              data: input.userImageBytes,
            },
            {
              type: "file",
              mediaType: garment.mediaType,
              data: garment.bytes,
            },
          ],
        },
      ],
    });

    const image = result.files.find((file) =>
      file.mediaType?.startsWith("image/")
    );

    if (!image) {
      return jsonError("La IA no devolvió una imagen", 503);
    }

    return NextResponse.json({
      image: `data:${image.mediaType};base64,${image.base64}`,
      model: TRY_ON_MODEL,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.error("Try-on generation error: generation timeout");
      return jsonError("La generación tardó demasiado. Probá de nuevo", 503);
    }
    if (error instanceof Error && error.message.includes("prenda")) {
      console.error(`Try-on generation error: ${error.message}`);
      return jsonError(error.message, 400);
    }

    const mapped = mapAiError(error);
    console.error(
      `Try-on generation error: ${mapped.status} ${mapped.message}`
    );
    return jsonError(mapped.message, mapped.status);
  }
}
