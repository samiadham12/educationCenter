# Google Stitch Prompt — Admin Staff Accounts Page

> Prerequisite: `00-project-overview.md` + admin layout.

---

## Task

Generate **staff account management** page (create Admin/Moderator users, list, disable).

**Output file:** `stitch-output/admin/staff/page.tsx`

**Route:** `/admin/staff`

**Access:** `SUPER_ADMIN`, `ADMIN` only.

---

## API Contracts

### List Staff

```http
GET /api/users?role=ADMIN,MODERATOR
```

**Response 200:**
```json
{
  "users": [
    {
      "_id": "665f1a2b3c4d5e6f7a8b9c0d",
      "email": "moderator@example.com",
      "name": "Sara Ali",
      "role": "MODERATOR",
      "isActive": true,
      "createdAt": "2026-01-15T08:00:00.000Z"
    }
  ]
}
```

### Create Staff

```http
POST /api/users/staff
Content-Type: application/json
```

**Request body:**
```json
{
  "email": "newadmin@example.com",
  "password": "SecurePass123!",
  "name": "Ahmed Hassan",
  "role": "ADMIN"
}
```

`role` enum: `"ADMIN"` | `"MODERATOR"`

**Response 201:**
```json
{
  "id": "665f...",
  "email": "newadmin@example.com",
  "name": "Ahmed Hassan",
  "role": "ADMIN"
}
```

**Errors:** `409` email exists, `400` validation.

### Disable Staff

```http
PATCH /api/users/:userId
Content-Type: application/json
```

**Request body:**
```json
{
  "isActive": false
}
```

---

## UI Layout

### Section A — Create Form (card)

| Field | Type | Validation |
|-------|------|------------|
| Full Name | text | required, max 100 |
| Email | email | required |
| Password | password | required, min 8 chars, show/hide toggle |
| Role | select | ADMIN or MODERATOR |

Submit button: **"Create Staff Account"**

On success: toast + clear form + refresh table.

### Section B — Staff Table

| Column | Notes |
|--------|-------|
| Name | |
| Email | |
| Role | Badge (ADMIN=purple, MODERATOR=orange) |
| Status | Active (green) / Disabled (gray) |
| Created | formatted date |
| Actions | "Disable" button if `isActive` |

Search/filter by name or email (client-side).

---

## UX Details

- Confirm dialog before disable: "Disable {name}? They will not be able to log in."
- Password strength hint below field
- No delete button (only disable per API)

---

## Acceptance Criteria

- [ ] Form validation before submit
- [ ] Table refreshes after create/disable
- [ ] Error messages from API shown in toast
- [ ] Empty state: "No staff accounts yet"
