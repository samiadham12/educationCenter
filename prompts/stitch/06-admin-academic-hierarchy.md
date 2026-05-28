# Google Stitch Prompt — Admin Academic Hierarchy Page

> Prerequisite: `00-project-overview.md` + admin layout.

---

## Task

Generate **full academic hierarchy CRUD** UI: Years → Terms → Subjects → Sections → Lectures.

**Output file:** `stitch-output/admin/hierarchy/page.tsx`

**Route:** `/admin/hierarchy`

---

## Hierarchy Tree

```
Academic Year (order 1-4: First, Second, Third, Fourth Year)
  └── Term (order 1-2: Term 1, Term 2)
        └── Subject
              └── Section (auto-created: 2 or 3 sections)
                    └── Lecture (+ auto-generated access code)
```

---

## API Contracts

### Academic Years

```http
GET    /api/academic-years
POST   /api/academic-years          Body: { "name": "First Year", "order": 1 }
PUT    /api/academic-years/:id      Body: { "name": "...", "isActive": true }
DELETE /api/academic-years/:id
```

### Terms

```http
GET    /api/terms?academicYearId={yearId}
POST   /api/terms                   Body: { "name": "Term 1", "academicYearId": "...", "order": 1 }
PUT    /api/terms/:id
DELETE /api/terms/:id
```

### Subjects

```http
GET    /api/subjects?termId={termId}
POST   /api/subjects                Body: { "name": "Mathematics", "termId": "...", "sectionCount": 2 }
PUT    /api/subjects/:id
DELETE /api/subjects/:id
```

**IMPORTANT:** `sectionCount` is `2` or `3`. Server auto-creates Section A, B, (C).

### Sections

```http
GET /api/sections?subjectId={subjectId}
```

Sections are auto-created — display only (rename via PUT if API added later).

### Lectures

```http
GET    /api/lectures?sectionId={sectionId}
POST   /api/lectures
```

**Create lecture body:**
```json
{
  "title": "Introduction to Algebra",
  "description": "Chapter 1 overview",
  "sectionId": "...",
  "subjectId": "...",
  "termId": "...",
  "academicYearId": "...",
  "isPublished": true
}
```

**Response 201:**
```json
{
  "lecture": { "_id": "...", "title": "..." },
  "code": { "code": "X7K9M2PL5VQ1", "lectureId": "..." }
}
```

Show code with **Copy to clipboard** button after create.

### Regenerate lecture code

```http
POST /api/lecture-codes/regenerate
Body: { "lectureId": "..." }
```

```http
GET /api/lecture-codes/:lectureId
```

---

## UI Design — Master-Detail or Tree

**Recommended:** Left panel tree (collapsible) + right panel CRUD form.

### Left tree nodes

- 📁 First Year
  - 📁 Term 1
    - 📁 Mathematics
      - 📄 Section A
        - 🎬 Lecture: Intro (code: X7K9...)

### Right panel actions

Based on selected node type, show:
- **Year:** Edit name, order, active toggle, Delete
- **Term:** Edit, Delete
- **Subject:** Create form includes `sectionCount` radio (2 or 3)
- **Lecture:** Create form + display code + Regenerate code button + Publish toggle

### Create buttons at each level

Floating `+ Add Term`, `+ Add Subject`, etc.

---

## Modals

Use shadcn Dialog for create/edit forms.

---

## Acceptance Criteria

- [ ] Tree reflects live API data
- [ ] Creating subject with sectionCount 2 or 3 refreshes tree
- [ ] New lecture shows access code with copy button
- [ ] Regenerate code with confirmation
- [ ] Delete confirmations at every level
- [ ] Breadcrumb showing full path to selected lecture
