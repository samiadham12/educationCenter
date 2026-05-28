import { randomBytes, createHmac } from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
  const token = randomBytes(32).toString("hex");
  const secret = (process.env.CSRF_SECRET ?? "csrf-dev").trim();
  const signed = createHmac("sha256", secret).update(token).digest("hex");

  const res = NextResponse.json({ csrfToken: token, signedToken: signed });
  res.cookies.set("csrf-token", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  res.headers.set("X-CSRF-Token", signed);
  return res;
}
