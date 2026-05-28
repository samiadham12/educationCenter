# Google Stitch Prompt — Admin Layout Shell

> Prerequisite: Read `00-project-overview.md` first.

---

## Task

Generate the **admin dashboard layout shell** used by all `/admin/*` pages.

**Output file:** `stitch-output/admin/layout.tsx`

**Route:** Wraps all pages under `/admin` (Next.js App Router layout).

---

## Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ [Logo] Education Center          [User ▼] [Logout] │  ← Top bar
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │  {children}                              │
│          │                                          │
│ Dashboard│                                          │
│ Staff    │                                          │
│ Students │                                          │
│ Uploads  │                                          │
│ Hierarchy│                                          │
│ Users    │                                          │
│ Usage    │                                          │
└──────────┴──────────────────────────────────────────┘
```

---

## Sidebar Navigation Links

| Label | href | Visible for |
|-------|------|-------------|
| Dashboard | `/admin` | ALL staff roles |
| Staff Accounts | `/admin/staff` | `SUPER_ADMIN`, `ADMIN` only |
| Student Accounts | `/admin/students` | `SUPER_ADMIN`, `ADMIN` only |
| Media Upload | `/admin/uploads` | `SUPER_ADMIN`, `ADMIN`, `MODERATOR` |
| Academic Hierarchy | `/admin/hierarchy` | `SUPER_ADMIN`, `ADMIN`, `MODERATOR` |
| Users & Subscriptions | `/admin/users` | `SUPER_ADMIN`, `ADMIN` only |
| Usage Analytics | `/admin/usage` | `SUPER_ADMIN`, `ADMIN`, `MODERATOR` |

---

## API — Session

```http
GET /api/auth/session
```

**Response 200:**
```json
{
  "user": {
    "id": "665f...",
    "email": "admin@example.com",
    "name": "Super Admin",
    "role": "SUPER_ADMIN"
  }
}
```

**Response 401:** Redirect to `/login`.

---

## Logout

```http
POST /api/auth/logout
```

Then redirect to `/login`. Also support NextAuth `signOut({ callbackUrl: "/login" })` from `next-auth/react`.

---

## Requirements

1. **Sidebar:** Fixed left, width 240px, collapsible to icons-only on tablet; hamburger drawer on mobile.
2. **Active link:** Highlight current path (use `usePathname()`).
3. **Top bar:** Show `user.name`, `user.email`, role badge (color-coded).
4. **Role guard:** Hide sidebar items per table above — do not render links user cannot access.
5. **Loading:** Show skeleton while session loads.
6. **Unauthorized:** If session fails, `redirect("/login")`.
7. Export layout as default: `export default function AdminLayout({ children })`.

---

## Props

```typescript
{ children: React.ReactNode }
```

---

## Do NOT

- Implement page content (only shell + `{children}`)
- Call admin stats APIs here
- Use light theme

---

## Acceptance Criteria

- [ ] All 7 nav items with correct role visibility
- [ ] Mobile responsive drawer
- [ ] Logout works
- [ ] Active route highlighted
- [ ] Dark theme consistent with overview
