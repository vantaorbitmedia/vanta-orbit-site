import speakeasy from "speakeasy";

function getAdmin2faSecret() {
  return process.env.ADMIN_2FA_SECRET?.trim() ?? "";
}

export function isAdmin2faConfigured() {
  return Boolean(getAdmin2faSecret());
}

export function verifyAdminTotpCode(code: string) {
  const secret = getAdmin2faSecret();
  const token = code.trim();

  if (!secret || !/^\d{6}$/.test(token)) {
    return false;
  }

  return speakeasy.totp.verify({
    secret,
    token,
    encoding: "base32",
    window: 1,
  });
}
