# Google Stitch Prompts — Usage Guide

Send each file below to **Google Stitch** as a separate prompt, **in order** (00 first, then 01, then page-specific files).

## Order

| # | File | Output in `stitch-output/` |
|---|------|---------------------------|
| 0 | `00-project-overview.md` | Read first — global rules |
| 1 | `01-admin-layout.md` | `admin/layout.tsx` |
| 2 | `02-admin-dashboard-home.md` | `admin/page.tsx` |
| 3 | `03-admin-staff-accounts.md` | `admin/staff/page.tsx` |
| 4 | `04-admin-student-accounts.md` | `admin/students/page.tsx` |
| 5 | `05-admin-media-upload.md` | `admin/uploads/page.tsx` |
| 6 | `06-admin-academic-hierarchy.md` | `admin/hierarchy/page.tsx` |
| 7 | `07-admin-users-subscriptions.md` | `admin/users/page.tsx` |
| 8 | `08-admin-usage-analytics.md` | `admin/usage/page.tsx` |
| 9 | `09-student-app-shell.md` | `student/layout.tsx` |
| 10 | `10-student-lecture-code-entry.md` | `student/code/page.tsx` |
| 11 | `11-student-content-browser.md` | `student/page.tsx` |
| 12 | `12-media-video-player.md` | `components/media/VideoPlayer.tsx` |
| 13 | `13-media-audio-player.md` | `components/media/AudioPlayer.tsx` |
| 14 | `14-media-pdf-viewer.md` | `components/media/PdfViewer.tsx` |
| 15 | `15-student-watch-page.md` | `student/watch/page.tsx` |

## After Stitch generates code

1. Copy files into `stitch-output/` matching paths above.
2. Create thin shells in `src/app/` that re-export Stitch components.
3. Test against running API at `http://localhost:3000`.
