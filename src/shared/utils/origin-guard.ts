export function isValidOrigin(req: Request): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const allowed = new Set([
    appUrl,
    appUrl.replace(/\/$/, ""),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (origin && allowed.has(origin)) return true;
  if (referer) {
    try {
      const ref = new URL(referer);
      for (const base of allowed) {
        const b = new URL(base);
        if (ref.origin === b.origin) return true;
      }
    } catch {
      return false;
    }
  }

  // Some media fetches (native HLS, certain players) may omit Origin/Referer.
  // In that case, fall back to validating the request URL origin itself.
  try {
    const reqOrigin = new URL(req.url).origin;
    for (const base of allowed) {
      const b = new URL(base);
      if (reqOrigin === b.origin) return true;
    }
  } catch {
    // ignore
  }

  return process.env.NODE_ENV === "development";
}
