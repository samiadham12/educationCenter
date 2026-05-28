# Google Stitch Prompt — Admin Usage Analytics Page

> Prerequisite: `00-project-overview.md` + admin layout.

---

## Task

Generate **per-user media consumption analytics** dashboard with export.

**Output file:** `stitch-output/admin/usage/page.tsx`

**Route:** `/admin/usage`

---

## API Contracts

### Usage Data

```http
GET /api/admin/usage
```

**Response 200:**
```json
{
  "usage": [
    {
      "_id": "...",
      "userId": { "name": "Mohamed", "email": "m@school.com" },
      "mediaId": { "fileName": "lesson1.mp4", "fileType": "VIDEO" },
      "lectureId": { "title": "Intro to Physics" },
      "watchedSeconds": 1845,
      "lastPosition": 1200,
      "totalDuration": 3600,
      "completionPercent": 51.25,
      "isCompleted": false,
      "updatedAt": "2026-05-25T14:30:00.000Z"
    }
  ]
}
```

### CSV Export

```http
GET /api/admin/usage/export
```

Returns `text/csv` file download. Use:

```html
<a href="/api/admin/usage/export" download="usage-export.csv">Export CSV</a>
```

Or `window.open` with credentials (use fetch + blob download for auth cookie).

**Recommended export fetch:**
```typescript
const res = await fetch("/api/admin/usage/export", { credentials: "include" });
const blob = await res.blob();
// trigger download
```

---

## UI Layout

### Filters Row

| Filter | Type | Notes |
|--------|------|-------|
| Search student | text | filter by name/email |
| Media type | select | ALL / VIDEO / AUDIO |
| Completion | select | ALL / Completed (≥95%) / In Progress |
| Date range | date from/to | filter by `updatedAt` client-side |

### Summary Cards (computed client-side)

- Total watch hours (sum watchedSeconds / 3600)
- Average completion %
- Unique students count

### Data Table

| Column | Format |
|--------|--------|
| Student | name + email subtext |
| Lecture | title |
| Media | fileName |
| Type | VIDEO/AUDIO badge |
| Minutes Watched | `watchedSeconds / 60` 1 decimal |
| Completion | progress bar + percent |
| Last Active | relative time ("2 hours ago") |

Default sort: `updatedAt` descending.

### Export Button

Top-right: **"Export CSV"** with download icon.

---

## Pagination

Client-side pagination: 25 rows per page.

---

## Acceptance Criteria

- [ ] Table handles 500+ rows smoothly
- [ ] Progress bar visual for completionPercent
- [ ] CSV export downloads correctly with auth
- [ ] Empty state: "No usage data yet"
- [ ] Loading skeleton on fetch
