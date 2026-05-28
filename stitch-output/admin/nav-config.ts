import type { Role } from "@/shared/constants/roles";

export type AdminNavItem = {
  href: "/admin" | "/admin/staff" | "/admin/students" | "/admin/uploads" | "/admin/hierarchy" | "/admin/users" | "/admin/usage";
  labelKey:
    | "dashboard"
    | "staff"
    | "students"
    | "uploads"
    | "hierarchy"
    | "users"
    | "usage";
  icon: string;
  roles: Role[];
};

export const adminNavItems: AdminNavItem[] = [
  {
    href: "/admin",
    labelKey: "dashboard",
    icon: "dashboard",
    roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"],
  },
  {
    href: "/admin/staff",
    labelKey: "staff",
    icon: "badge",
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    href: "/admin/students",
    labelKey: "students",
    icon: "school",
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    href: "/admin/uploads",
    labelKey: "uploads",
    icon: "cloud_upload",
    roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"],
  },
  {
    href: "/admin/hierarchy",
    labelKey: "hierarchy",
    icon: "account_tree",
    roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"],
  },
  {
    href: "/admin/users",
    labelKey: "users",
    icon: "payments",
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    href: "/admin/usage",
    labelKey: "usage",
    icon: "analytics",
    roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"],
  },
];

export function getVisibleNavItems(role: Role | undefined): AdminNavItem[] {
  if (!role) return [];
  return adminNavItems.filter((item) => item.roles.includes(role));
}

export function formatRoleBadgeKey(role: Role): string {
  return role;
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
