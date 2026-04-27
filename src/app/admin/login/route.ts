import { NextResponse, type NextRequest } from "next/server";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
  isAdminEnvConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import {
  checkLoginRateLimit,
  clearFailedLogins,
  getClientRateLimitKey,
  recordFailedLogin,
} from "@/lib/admin-rate-limit";
import { verifyAdminTotpCode } from "@/lib/admin-2fa";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const twoFactorCode = String(formData.get("twoFactorCode") ?? "");
  const rateLimitKey = getClientRateLimitKey(request.headers);
  const origin = new URL("/admin", request.url);

  if (!isAdminEnvConfigured()) {
    origin.searchParams.set("error", "Admin environment is not configured.");
    return NextResponse.redirect(origin, { status: 303 });
  }

  const limit = checkLoginRateLimit(rateLimitKey);
  if (!limit.allowed) {
    origin.searchParams.set("error", "Too many login attempts. Please wait and try again.");
    return NextResponse.redirect(origin, { status: 303 });
  }

  if (!verifyAdminPassword(password)) {
    const result = recordFailedLogin(rateLimitKey);
    origin.searchParams.set(
      "error",
      result.blocked
        ? "Too many login attempts. Please wait and try again."
        : "Incorrect password.",
    );
    return NextResponse.redirect(origin, { status: 303 });
  }

  if (!twoFactorCode.trim()) {
    recordFailedLogin(rateLimitKey);
    origin.searchParams.set("error", "2FA code required.");
    return NextResponse.redirect(origin, { status: 303 });
  }

  if (!verifyAdminTotpCode(twoFactorCode)) {
    const result = recordFailedLogin(rateLimitKey);
    origin.searchParams.set(
      "error",
      result.blocked
        ? "Too many login attempts. Please wait and try again."
        : "Invalid 2FA code.",
    );
    return NextResponse.redirect(origin, { status: 303 });
  }

  clearFailedLogins(rateLimitKey);

  const response = NextResponse.redirect(new URL("/admin/dashboard", request.url), {
    status: 303,
  });
  response.cookies.set(getSessionCookieName(), createSessionToken(), getSessionCookieOptions());
  return response;
}
