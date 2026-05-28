/** Header the official in-app player sends; download tools copying URLs won't include it. */
export const STREAM_CLIENT_HEADER = "X-Stream-Client";
export const STREAM_CLIENT_VALUE = "edu-player";

export function isStreamClientRequest(req: Request): boolean {
  return req.headers.get(STREAM_CLIENT_HEADER) === STREAM_CLIENT_VALUE;
}

/** Safari native HLS cannot set custom headers; allow same-site Referer + session. */
export function isSameSiteStreamReferer(req: Request): boolean {
  const referer = req.headers.get("referer");
  if (!referer) return false;
  try {
    const refOrigin = new URL(referer).origin;
    const host = req.headers.get("host");
    if (!host) return false;
    const proto =
      req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
      (host.includes("localhost") ? "http" : "https");
    return refOrigin === `${proto}://${host}`;
  } catch {
    return false;
  }
}

export function isTrustedStreamRequest(req: Request): boolean {
  return isStreamClientRequest(req) || isSameSiteStreamReferer(req);
}

export function streamClientGuardResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Stream only available through the app player" }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    },
  );
}
