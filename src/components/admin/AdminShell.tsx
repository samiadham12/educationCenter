"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/uploads", label: "Uploads" },
  { href: "/admin/hierarchy", label: "Hierarchy" },
  { href: "/admin/users", label: "Users & Subs" },
  { href: "/admin/usage", label: "Usage" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-slate-700 bg-slate-900 p-4">
        <p className="mb-6 text-sm font-semibold text-slate-400">
          Education Center
        </p>
        <nav className="flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded px-3 py-2 text-sm ${
                pathname === l.href
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t border-slate-700 pt-4 text-xs text-slate-400">
          <p>{session?.user?.email}</p>
          <p className="mt-1">{session?.user?.role}</p>
          <button
            type="button"
            className="mt-3 text-red-400 hover:underline"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
