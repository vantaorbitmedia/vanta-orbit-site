import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin2faConfigured } from "@/lib/admin-2fa";

const SESSION_COOKIE_NAME = "vanta_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

type SessionPayload = {
  exp: number;
  role: "admin";
};

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

function getSessionSecret() {
  return process.env.SESSION_SECRET ?? "";
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function isAdminEnvConfigured() {
  return Boolean(getAdminPassword() && getSessionSecret() && isAdmin2faConfigured());
}

function normalizeSecretInput(value: string) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function verifyAdminPassword(password: string) {
  if (!isAdminEnvConfigured()) return false;

  const expected = normalizeSecretInput(getAdminPassword());
  const attempted = normalizeSecretInput(password);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const attemptedBuffer = Buffer.from(attempted, "utf8");

  return (
    attemptedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(attemptedBuffer, expectedBuffer)
  );
}

export function createSessionToken() {
  const payload: SessionPayload = {
    exp: Date.now() + SESSION_TTL_MS,
    role: "admin",
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token?: string | null) {
  if (!token || !isAdminEnvConfigured()) return false;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const expectedSignature = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload;
    return payload.role === "admin" && typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + SESSION_TTL_MS),
  };
}

export async function isAuthenticatedAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return verifySessionToken(sessionCookie?.value);
}

export async function requireAdminSession() {
  const authenticated = await isAuthenticatedAdmin();

  if (!authenticated) {
    redirect("/admin");
  }
}
