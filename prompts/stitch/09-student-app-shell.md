# Google Stitch Prompt — Student App Shell Layout

> Prerequisite: `00-project-overview.md` first.

---

## Task

Generate **student-facing app layout** shell for all `/student/*` routes.

**Output file:** `stitch-output/student/layout.tsx`

**Route:** Wraps `/student`, `/student/code`, `/student/watch/[lectureId]`

---

## API — Session

```http
GET /api/auth/session
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "student@school.com",
    "name": "Mohamed Ali",
    "role": "STUDENT"
  }
}
```

Redirect to `/login` if not authenticated or role is not STUDENT.

---

## Layout Design

```
┌────────────────────────────────────────────────────┐
│  🎓 Education Center    [Browse] [Code] [Logout]   │
│  Current Year: Second Year                         │
├────────────────────────────────────────────────────┤
│                                                    │
│  {children}                                        │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Navigation

| Link | href | Description |
|------|------|-------------|
| Browse Content | `/student` | Content tree |
| Enter Code | `/student/code` | Redeem lecture code |
| Logout | action | POST /api/auth/logout or signOut |

---

## Header Info

- Show student name from session
- Show academic year label if available (optional: fetch from user profile or display "Student Portal")
- Mobile: hamburger menu for nav links

---

## Styling

- Slightly lighter student theme than admin (still dark)
- Accent color: emerald-500 for primary actions
- Friendly, minimal, focus on content consumption

---

## Requirements

1. `"use client"` layout
2. Protect route — non-students redirected to `/login`
3. Loading state while checking session
4. `{children}` rendered in main content area with max-width container

---

## Acceptance Criteria

- [ ] Only STUDENT role can access
- [ ] Nav highlights active route
- [ ] Responsive header
- [ ] Logout works
