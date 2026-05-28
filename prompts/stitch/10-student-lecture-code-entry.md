# Google Stitch Prompt — Student Lecture Code Entry Page

> Prerequisite: `00-project-overview.md` + `09-student-app-shell.md`.

---

## Task

Generate **lecture code redemption** page — student enters code to unlock a single lecture.

**Output file:** `stitch-output/student/code/page.tsx`

**Route:** `/student/code`

---

## API Contract

```http
POST /api/lecture-codes/redeem
Content-Type: application/json
```

**Request:**
```json
{
  "code": "X7K9M2PL5VQ1"
}
```

Code is **uppercase alphanumeric**, 12 characters. Auto-uppercase input as user types.

**Response 200 (success):**
```json
{
  "success": true,
  "lectureId": "665f1a2b3c4d5e6f7a8b9c0d"
}
```

**Response 200 (already redeemed):**
```json
{
  "success": true,
  "lectureId": "...",
  "message": "Already redeemed"
}
```

**Errors:**
| Status | Meaning |
|--------|---------|
| 404 | Invalid code |
| 410 | Code expired or usage limit reached |
| 429 | Too many attempts (5/minute) |

On success → `router.push(/student/watch/${lectureId})`

---

## UI Design

### Centered card (max-w-md)

```
┌─────────────────────────────────┐
│     🔑 Enter Lecture Code       │
│                                 │
│  ┌───────────────────────────┐  │
│  │  X 7 K 9 M 2 P L 5 V Q 1  │  │  ← large monospace input
│  └───────────────────────────┘  │
│                                 │
│      [ Unlock Lecture ]         │
│                                 │
│  Enter the code provided by     │
│  your instructor.               │
└─────────────────────────────────┘
```

### Input behavior

- `text-transform: uppercase`
- `letter-spacing: 0.2em`
- `maxLength={12}`
- Auto-focus on mount
- Submit on Enter key

### Error display

Red alert below input with API error message.

### Loading

Disable button + spinner during request.

---

## Acceptance Criteria

- [ ] Redirects to watch page on success
- [ ] Handles 429 with "Try again later"
- [ ] Input auto-uppercase
- [ ] Accessible label and aria-describedby for errors
- [ ] Link back to Browse: "← Back to content"
