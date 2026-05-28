import { withSecurityLayers } from "@/layers";
import { mainRouter } from "@/app/api/router";
import type { ApiContext } from "@/shared/types/api";

const securedHandler = withSecurityLayers(mainRouter);

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

export async function buildApiContext(
  req: Request,
  path: string,
  segments: string[],
): Promise<ApiContext> {
  const url = new URL(req.url);

  let body: unknown = {};
  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await req.json().catch(() => ({}));
    }
  }

  return {
    req,
    method: req.method,
    path,
    segments,
    params: {},
    query: url.searchParams,
    body,
    ip: getClientIp(req),
  };
}

export async function dispatchApi(
  req: Request,
  path: string,
  segments: string[],
): Promise<Response> {
  const ctx = await buildApiContext(req, path, segments);
  return securedHandler(ctx);
}
