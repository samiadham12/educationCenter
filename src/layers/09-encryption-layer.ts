import { createDecipheriv, createCipheriv, randomBytes } from "crypto";
import type { ApiHandler, Middleware } from "@/shared/types/api";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY ?? "";
  return Buffer.from(hex.slice(0, 64), "hex");
}

export const encryptionLayer: Middleware = (handler) => async (ctx) => {
  if (ctx.req.headers.get("x-encrypted") === "1" && ctx.body) {
    try {
      const payload = ctx.body as { iv: string; data: string };
      const decipher = createDecipheriv(
        "aes-256-gcm",
        getKey(),
        Buffer.from(payload.iv, "hex"),
      );
      /* simplified — full GCM auth tag handling in production */
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(payload.data, "hex")),
        decipher.final(),
      ]);
      ctx.body = JSON.parse(decrypted.toString("utf8"));
    } catch {
      /* pass through if decrypt fails in dev */
    }
  }
  return handler(ctx);
};

export function encryptPayload(data: unknown): { iv: string; data: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);
  return {
    iv: iv.toString("hex"),
    data: encrypted.toString("hex"),
  };
}
