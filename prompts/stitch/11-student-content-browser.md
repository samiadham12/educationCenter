# Google Stitch Prompt — Student Content Browser Page

> Prerequisite: `00-project-overview.md` + `09-student-app-shell.md`.

---

## Task

Generate **hierarchical content browser** — student navigates Year → Term → Subject → Section → Lectures.

**Output file:** `stitch-output/student/page.tsx`

**Route:** `/student`

---

## API Contract

```http
GET /api/student/content-tree
```

**Response 200:**
```json
{
  "tree": [
    {
      "_id": "year1",
      "name": "First Year",
      "order": 1,
      "terms": [
        {
          "_id": "term1",
          "name": "Term 1",
          "order": 1,
          "subjects": [
            {
              "_id": "sub1",
              "name": "Mathematics",
              "sections": [
                {
                  "_id": "sec1",
                  "name": "Section A",
                  "lectures": [
                    {
                      "_id": "lec1",
                      "title": "Introduction",
                      "hasAccess": true
                    },
                    {
                      "_id": "lec2",
                      "title": "Advanced Topic",
                      "hasAccess": false
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

`hasAccess: true` = student can open lecture (subscription or code).
`hasAccess: false` = show locked state.

---

## UI Design — Accordion / Nested Cards

### Level 1: Academic Year (accordion)

### Level 2: Term (nested accordion)

### Level 3: Subject (card grid)

### Level 4: Section (tabs or sub-list)

### Level 5: Lectures (list items)

**Lecture row:**
```
┌─────────────────────────────────────────────┐
│ 🎬 Introduction to Algebra        [Open]  │  ← hasAccess true
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ 🔒 Advanced Topic              [Locked]     │  ← hasAccess false, greyed
│    Subscribe or enter a code to unlock      │
└─────────────────────────────────────────────┘
```

### Open button

Navigates to `/student/watch/{lectureId}` only if `hasAccess === true`.

For locked lectures: button disabled + tooltip.

---

## Media type indicators (optional)

After opening, watch page handles video/audio/pdf — browser page only lists lectures.

---

## Empty States

- No tree: "No content available yet."
- No access to any lecture in term: banner suggesting "Enter a code" linking to `/student/code`

---

## Search (optional enhancement)

Filter lectures by title across entire tree.

---

## Acceptance Criteria

- [ ] Only `hasAccess: true` lectures are clickable
- [ ] Locked lectures visually distinct (opacity 50%, lock icon)
- [ ] Accordion remembers expanded state in sessionStorage
- [ ] Loading skeleton while fetching tree
- [ ] Mobile-friendly nested navigation
