# MongoDB Models — Performance & Index Reference

> **Canonical specification:** See `plan.md` **Section 16** for full Mongoose schemas, hooks, Redis keys, and Auth.js adapter models.

This file is a quick reference. All implementation details live in `plan.md` §16.

---

## Model Index

| # | Model | Collection | Sharding (when needed) |
|---|-------|------------|------------------------|
| 1 | User | `users` | Hashed `currentAcademicYearId` (>10M students) |
| 2 | AcademicYear | `academic_years` | None |
| 3 | Term | `terms` | None |
| 4 | Subject | `subjects` | None |
| 5 | Section | `sections` | None |
| 6 | Lecture | `lectures` | Hashed `academicYearId` |
| 7 | Media | `media` | Hashed `lectureId` |
| 8 | LectureCode | `lecture_codes` | Hashed `code` (high redeem load) |
| 9 | LectureCodeUsage | `lecture_code_usages` | Hashed `userId` |
| 10 | Subscription | `subscriptions` | Hashed `userId` |
| 11 | Progress | `progress` | Hashed `userId` |
| 12 | AuditLog | `audit_logs` | Range `timestamp` or hashed `userId` |
| 13 | Session | `sessions` | Hashed `userId` |
| 14 | Account | `accounts` | Hashed `userId` |
| 15 | VerificationToken | `verification_tokens` | None |

---

## Redis Cache Keys (Summary)

| Key | TTL |
|-----|-----|
| `user:session:{sessionId}` | 24h |
| `hierarchy:years` | 1h |
| `hierarchy:terms:{termId}` | 1h |
| `stream:token:{token}` | 15m |
| `lecture_code:{code}` | 1h |
| `access:lecture:{userId}:{lectureId}` | 24h |
| `subs:user:{userId}` | 15m |
| `progress:buffer` | batch flush 10s |
| `session:{sessionToken}` | = session expires |

---

For schemas, indexes, hooks, and business rules → **`plan.md` Section 16**.
