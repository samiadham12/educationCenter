import type { Role } from "@/shared/constants/roles";

export type Permission =
  | "users:read"
  | "users:write"
  | "users:delete"
  | "content:read"
  | "content:write"
  | "content:delete"
  | "subscriptions:read"
  | "subscriptions:write"
  | "media:upload"
  | "media:stream"
  | "usage:read"
  | "promotion:execute"
  | "audit:read";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "users:read",
    "users:write",
    "users:delete",
    "content:read",
    "content:write",
    "content:delete",
    "subscriptions:read",
    "subscriptions:write",
    "media:upload",
    "media:stream",
    "usage:read",
    "promotion:execute",
    "audit:read",
  ],
  ADMIN: [
    "users:read",
    "users:write",
    "content:read",
    "content:write",
    "content:delete",
    "subscriptions:read",
    "subscriptions:write",
    "media:upload",
    "media:stream",
    "usage:read",
    "promotion:execute",
    "audit:read",
  ],
  MODERATOR: [
    "content:read",
    "content:write",
    "usage:read",
    "media:upload",
    "media:stream",
  ],
  STUDENT: ["media:stream"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
