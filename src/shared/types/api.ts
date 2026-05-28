import type { Role } from "@/shared/constants/roles";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  preferredLocale: string;
}

export interface ApiContext {
  req: Request;
  method: string;
  path: string;
  segments: string[];
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  user?: AuthUser;
  sessionId?: string;
  ip: string;
  locale?: string;
}

export type ApiHandler = (ctx: ApiContext) => Promise<Response>;

export type Middleware = (
  handler: ApiHandler,
) => (ctx: ApiContext) => Promise<Response>;
