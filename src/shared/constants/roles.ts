export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MODERATOR",
  "STUDENT",
] as const;

export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "MODERATOR"];

export const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];
