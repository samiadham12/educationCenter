# Google Stitch Prompt — Project Overview (READ FIRST)

You are building the **complete frontend UI** for an educational platform. The backend API already exists. Generate production-quality React/Next.js 15 code only — no backend logic.

---

## Product

Online education platform with:

- Admin dashboard (staff manage content, users, subscriptions, uploads)
- Student app (browse content, redeem lecture codes, watch protected video/audio/PDF)
- Academic hierarchy: Year → Term → Subject → Sections (2 or 3) → Lectures
- Subscriptions: per term or full academic year
- Lecture access codes (single lecture, no subscription)
- Anti-download media streaming via API proxy (never direct R2 URLs)

---

## Tech Stack (MANDATORY)

| Item | Value |
|------|-------|
| Framework | Next.js 15 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Auth | NextAuth v5 — session cookie (`credentials: include` on all API calls) |
| Icons | lucide-react |
| Output folder | `stitch-output/` |
| Import alias | `@/stitch-output/...` |

---

## Global API Rules

- **Base URL:** `process.env.NEXT_PUBLIC_APP_URL` or `""` (same-origin)
- **Auth:** `fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" } })`
- **CSRF:** For `POST`/`PUT`/`PATCH`/`DELETE`, first call `GET /api/csrf`, read cookie `csrf-token`, send header `X-CSRF-Token` with HMAC-signed value from response header `X-CSRF-Token` OR use session cookie auth only (Bearer not used in browser)
- **Never** use Cloudflare R2 URLs directly in `<video src>`, `<audio src>`, or `<iframe src>`
- **Always** use `/api/stream/*` endpoints for media

---

## Design System

- **Theme:** Dark mode default — background `#0f172a` (slate-900), cards `slate-800`, borders `slate-700`
- **Primary:** Blue `#2563eb` (blue-600)
- **Success:** Green-400 | **Error:** Red-400 | **Warning:** Amber-400
- **Typography:** System font, clear hierarchy (h1 2xl bold, h2 lg semibold)
- **RTL:** Support optional Arabic labels via `dir="rtl"` prop; default LTR English
- **Responsive:** Mobile-first, sidebar collapses on `< md`

---

## Roles

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Everything |
| `ADMIN` | All admin pages except destructive user delete |
| `MODERATOR` | Content read/write, usage read — NO staff/student create, NO subscription assign |
| `STUDENT` | Student app only |

Read role from `GET /api/auth/session` → `{ user: { id, email, name, role } }`.

---

## Page Inventory (generate separately per prompt files 01–14)

### Admin (`/admin/*`)
1. Dashboard home
2. Staff accounts
3. Student accounts
4. Media upload
5. Academic hierarchy CRUD
6. Users & subscriptions
7. Usage analytics

### Student (`/student/*`)
1. Content browser
2. Lecture code entry
3. Watch lecture (video/audio/pdf players as components)

---

## Shared Utilities to Create

Create `stitch-output/lib/api.ts`:

```typescript
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}
```

---

## File Export Rules

- Every page: `export default function PageName()`
- Use `"use client"` for interactive pages
- No placeholder lorem — use real labels
- Loading skeletons + empty states + error toasts
- Do not modify `src/app/api/*` — API is done

---

## Acceptance Criteria (Global)

- [ ] All pages match dark theme
- [ ] All API calls use `credentials: "include"`
- [ ] No direct R2/storage URLs in DOM
- [ ] Role-based UI hiding works
- [ ] TypeScript compiles without errors
- [ ] Components are accessible (labels, aria, keyboard)

---

**Next:** Send prompt `01-admin-layout.md` after this overview.
