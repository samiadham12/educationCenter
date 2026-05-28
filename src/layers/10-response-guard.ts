import type { ApiHandler, Middleware } from "@/shared/types/api";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'",
};

export const responseGuard: Middleware = (handler) => async (ctx) => {
  try {
    const response = await handler(ctx);
    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
      headers.set(k, v);
    }

    if (response.status >= 500 && process.env.NODE_ENV === "production") {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: response.status,
        headers,
      });
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    const { apiErrorToResponse } = await import("@/shared/utils/api-error");
    const errorRes = apiErrorToResponse(err, {
      method: ctx.method,
      path: ctx.path,
    });
    const headers = new Headers(errorRes.headers);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
      headers.set(k, v);
    }
    return new Response(errorRes.body, {
      status: errorRes.status,
      headers,
    });
  }
};
