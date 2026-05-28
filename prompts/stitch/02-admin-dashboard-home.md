# Google Stitch Prompt — Admin Dashboard Home

> Prerequisite: `00-project-overview.md` + `01-admin-layout.md` (layout wraps this page).

---

## Task

Generate the **admin dashboard home page** with statistics and recent activity.

**Output file:** `stitch-output/admin/page.tsx`

**Route:** `/admin`

---

## API Contracts

### Get Stats

```http
GET /api/admin/stats
```

**Response 200:**
```json
{
  "students": 1240,
  "activeSubscriptions": 890,
  "mediaReady": 456,
  "recentActivity": [
    {
      "_id": "...",
      "action": "POST /api/lectures",
      "endpoint": "/api/lectures",
      "method": "POST",
      "timestamp": "2026-05-25T10:00:00.000Z",
      "userId": "..."
    }
  ]
}
```

### Annual Promotion (Super Admin / Admin)

```http
POST /api/academic-years/promote-all
Content-Type: application/json
Body: {}
```

**Response 200:**
```json
{
  "promoted": 150,
  "skipped": 12
}
```

Show confirmation dialog before executing. Display result in toast.

---

## UI Components

### Row 1 — Stat Cards (4 cards)

| Card | Field | Icon suggestion |
|------|-------|-----------------|
| Total Students | `students` | Users |
| Active Subscriptions | `activeSubscriptions` | CreditCard |
| Media Ready | `mediaReady` | Film |
| Uploads This Week | Calculate client-side or show `mediaReady` subtitle | Upload |

Use large number typography (3xl bold).

### Row 2 — Recent Activity Table

| Column | Source |
|--------|--------|
| Action | `action` |
| Method | `method` (badge: GET=gray, POST=blue, DELETE=red) |
| Time | `timestamp` formatted local |

Max 10 rows from `recentActivity`. Empty state: "No recent activity."

### Row 3 — Actions

- Button: **"Execute Annual Promotion"** (destructive outline) — visible only for `SUPER_ADMIN` and `ADMIN`
- Subtitle: "Promotes all students to next grade on September 1 criteria (no cron)."

---

## States

- **Loading:** Skeleton cards + table
- **Error:** Red alert banner with retry button
- **Success:** Normal render

---

## Acceptance Criteria

- [ ] Fetches stats on mount
- [ ] Promotion button with confirm dialog
- [ ] Responsive grid: 1 col mobile, 2 col tablet, 4 col desktop
- [ ] Uses shared `api()` helper from `stitch-output/lib/api.ts`
