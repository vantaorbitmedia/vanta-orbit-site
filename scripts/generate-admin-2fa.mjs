import qrcode from "qrcode";
import speakeasy from "speakeasy";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

if (process.env.NODE_ENV === "production") {
  console.error("This setup script is development-only and will not run in production.");
  process.exit(1);
}

const secret = speakeasy.generateSecret({
  name: "Vanta Orbit Admin",
  issuer: "Vanta Orbit Media",
  length: 32,
});

if (!secret.otpauth_url) {
  console.error("Failed to generate otpauth URL.");
  process.exit(1);
}

console.log("ADMIN_2FA_SECRET=");
console.log(secret.base32);
console.log("");
console.log("otpauth URL:");
console.log(secret.otpauth_url);
console.log("");
console.log("Scan this QR code with your authenticator app:");
console.log(await qrcode.toString(secret.otpauth_url, { type: "terminal" }));

const outputDir = path.join(process.cwd(), ".admin-setup");
const outputPath = path.join(outputDir, "admin-2fa-qr.png");
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, await qrcode.toBuffer(secret.otpauth_url, { type: "png", width: 640 }));

console.log("");
console.log("QR PNG saved to:");
console.log(outputPath);
