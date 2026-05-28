import { connectMongo } from "@/shared/lib/mongodb";
import { AuditLog } from "@/features/auth/models/AuditLog.model";
import type { ApiHandler, Middleware } from "@/shared/types/api";

export const auditLogger: Middleware = (handler) => async (ctx) => {
  const response = await handler(ctx);

  if (ctx.path.startsWith("/api/") && ctx.method !== "GET") {
    void (async () => {
      try {
        await connectMongo();
        await AuditLog.collection.insertOne(
          {
            userId: ctx.user?.id,
            action: `${ctx.method} ${ctx.path}`,
            endpoint: ctx.path,
            method: ctx.method,
            ip: ctx.ip,
            userAgent: ctx.req.headers.get("user-agent") ?? undefined,
            timestamp: new Date(),
          },
          { writeConcern: { w: 1 } },
        );
      } catch {
        /* non-blocking */
      }
    })();
  }

  return response;
};
