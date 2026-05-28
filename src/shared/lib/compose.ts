import type { ApiHandler, Middleware } from "@/shared/types/api";

export function compose(...middlewares: Middleware[]): (handler: ApiHandler) => ApiHandler {
  return (handler: ApiHandler) =>
    middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler,
    );
}
