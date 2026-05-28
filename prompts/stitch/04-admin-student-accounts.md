# Google Stitch Prompt — Admin Student Accounts Page

> Prerequisite: `00-project-overview.md` + admin layout.

---

## Task

Generate **student account management** — single create + bulk CSV import.

**Output file:** `stitch-output/admin/students/page.tsx`

**Route:** `/admin/students`

---

## API Contracts

### List Academic Years (for dropdown)

```http
GET /api/academic-years
```

**Response:**
```json
{
  "academicYears": [
    { "_id": "year1", "name": "First Year", "order": 1, "isActive": true },
    { "_id": "year2", "name": "Second Year", "order": 2, "isActive": true }
  ]
}
```

### Create Single Student

```http
POST /api/users/students
```

**Request:**
```json
{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "name": "Mohamed Student",
  "currentAcademicYearId": "year1",
  "currentYearOrder": 1
}
```

`currentYearOrder`: integer `1` | `2` | `3` | `4`

**Response 201:** `{ "id": "...", "email": "..." }`

### Bulk Create

```http
POST /api/users/students/bulk
```

**Request:**
```json
{
  "students": [
    {
      "email": "s1@school.com",
      "password": "Pass123456!",
      "name": "Student One",
      "currentAcademicYearId": "year1",
      "currentYearOrder": 1
    }
  ]
}
```

**Response 201:**
```json
{
  "created": [{ "id": "...", "email": "s1@school.com" }],
  "errors": [{ "email": "dup@school.com", "error": "duplicate key" }]
}
```

---

## UI Layout — Two Tabs

### Tab 1: Single Student

Form fields:
- Full Name
- Email
- Password (with generate random button)
- Academic Year (dropdown from API — store `_id`)
- Year Order (dropdown 1–4, labels: "First Year" … "Fourth Year")

### Tab 2: Bulk Import

1. **CSV format help** (collapsible):
   ```
   email,password,name,currentAcademicYearId,currentYearOrder
   student1@test.com,Pass123!,Ali Hassan,yearIdHere,1
   ```
2. Textarea OR file upload (parse CSV client-side with Papa Parse or manual split)
3. Preview table (first 5 rows) before submit
4. Button: **"Import Students"**
5. Results panel: `created` count (green) + `errors` list (red)

---

## Optional: List Students

```http
GET /api/users?role=STUDENT
```

Show paginated table below forms (email, name, year order, active status).

---

## Acceptance Criteria

- [ ] Tabs: Single | Bulk
- [ ] Year dropdown populated from API
- [ ] Bulk shows success/error summary
- [ ] CSV template download button
- [ ] Validates email format before bulk send
