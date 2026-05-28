# Google Stitch Prompt — Admin Users & Subscriptions Page

> Prerequisite: `00-project-overview.md` + admin layout.

---

## Task

Generate **user management and subscription assignment** page.

**Output file:** `stitch-output/admin/users/page.tsx`

**Route:** `/admin/users`

**Access:** `SUPER_ADMIN`, `ADMIN` only.

---

## API Contracts

### List Students

```http
GET /api/users?role=STUDENT
```

### List Academic Years & Terms (for subscription form)

```http
GET /api/academic-years
GET /api/terms?academicYearId={yearId}
```

### List Subscriptions

```http
GET /api/subscriptions
GET /api/subscriptions?userId={userId}
```

**Response:**
```json
{
  "subscriptions": [
    {
      "_id": "...",
      "userId": "...",
      "type": "TERM",
      "termId": "...",
      "academicYearId": "...",
      "startDate": "2026-09-01T00:00:00.000Z",
      "endDate": "2027-06-30T00:00:00.000Z",
      "isActive": true
    }
  ]
}
```

### Assign Subscription

```http
POST /api/subscriptions
```

**Request:**
```json
{
  "userId": "665f...",
  "type": "TERM",
  "termId": "665f...",
  "academicYearId": "665f...",
  "startDate": "2026-09-01",
  "endDate": "2027-01-31",
  "isActive": true
}
```

`type`: `"TERM"` | `"FULL_YEAR"`

- For `TERM`: `termId` **required**
- For `FULL_YEAR`: `termId` optional/null, `academicYearId` required

### Revoke Subscription

```http
PATCH /api/subscriptions/:subscriptionId
```

**Request:**
```json
{
  "isActive": false
}
```

---

## UI Layout

### Top: Search + Filters

- Search by name/email (client-side filter)
- Filter: Has active subscription | No subscription | All

### Main Table — Students

| Column | |
|--------|--|
| Name | |
| Email | |
| Year Order | `currentYearOrder` if available from user object |
| Active Subscriptions | count badge |
| Actions | "Manage" opens side panel |

### Side Panel / Drawer — Subscription Manager

When clicking "Manage" on a student:

1. Show current subscriptions list (type, term/year, dates, active badge)
2. **Assign new** form:
   - Type: radio TERM | FULL_YEAR
   - If TERM: Term dropdown (load terms by year)
   - Academic Year dropdown
   - Start date / End date pickers
   - Button: Assign
3. Each subscription row: **Revoke** button → PATCH isActive false

---

## Subscription Type Labels

| type | Display |
|------|---------|
| TERM | "Term Subscription" |
| FULL_YEAR | "Full Academic Year" |

---

## Acceptance Criteria

- [ ] Search filters students in real-time
- [ ] Side panel shows subscription history per user
- [ ] TERM vs FULL_YEAR toggles termId field visibility
- [ ] Date validation: endDate > startDate
- [ ] Toast on assign/revoke success
- [ ] Confirm before revoke
