import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

type RateLimitWindow = { count: number; resetAt: number };
const rateLimitWindows = new Map<string, RateLimitWindow>();

/**
 * A short, in-process burst limit. Route handlers keep their durable Appwrite
 * limits as well; this intentionally stops repeated requests before parsing a
 * body or uploading a file.
 */
export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rateLimitWindows.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitWindows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  current.count += 1;
  if (current.count <= limit) return { allowed: true, retryAfter: 0 };
  return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}

export function rejectCrossOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const expectedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? requestUrl.host;
    const expectedProtocol = (request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "")) + ":";
    if (originUrl.host === expectedHost && originUrl.protocol === expectedProtocol) return null;
  } catch {}
  return NextResponse.json({ error: "Origem da requisição não autorizada." }, { status: 403 });
}

export function clientFingerprint(request: Request) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const agent = request.headers.get("user-agent") ?? "unknown";
  const salt = process.env.CAECOMP_UPLOAD_SALT ?? "development-only";
  return createHash("sha256").update(`${address}|${agent}|${salt}`).digest("hex");
}

export function optionalWebUrl(value: unknown, maxLength = 2048) {
  if (value === undefined || value === null || value === "") return null;
  const text = String(value).trim();
  if (text.length > maxLength) return null;
  if (text.startsWith("/") && !text.startsWith("//")) return text;
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function validFileSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.slice(0, 8).every((value, index) => value === [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a][index]);
  if (mimeType === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (mimeType === "application/pdf") return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  if (mimeType.includes("openxmlformats-officedocument")) return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if (mimeType === "application/msword" || mimeType === "application/vnd.ms-excel") return bytes.slice(0, 8).every((value, index) => value === [0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1][index]);
  return false;
}
