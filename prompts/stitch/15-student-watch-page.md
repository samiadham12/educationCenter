# Google Stitch Prompt — Student Watch Lecture Page

> Prerequisite: `00-project-overview.md`, `09-student-app-shell.md`, `12`, `13`, `14` player components.

---

## Task

Generate **lecture watch page** that loads video, audio, and PDF for a lecture and uses the protected player components.

**Output file:** `stitch-output/student/watch/page.tsx`

**Route:** `/student/watch/[lectureId]` (dynamic segment)

---

## API — List lecture media

```http
GET /api/media?lectureId={lectureId}
```

**Response:**
```json
{
  "media": [
    {
      "_id": "media1",
      "fileName": "lesson.mp4",
      "fileType": "VIDEO",
      "uploadStatus": "READY",
      "durationSeconds": 3600
    },
    {
      "_id": "media2",
      "fileName": "lesson.mp3",
      "fileType": "AUDIO",
      "uploadStatus": "READY"
    },
    {
      "_id": "media3",
      "fileName": "notes.pdf",
      "fileType": "PDF",
      "uploadStatus": "READY"
    }
  ]
}
```

### Session (for PDF watermark)

```http
GET /api/auth/session
```

---

## Page Layout

```
┌────────────────────────────────────────────┐
│ ← Back to Content    Lecture Title         │
├────────────────────────────────────────────┤
│ [ Video ] [ Audio ] [ PDF ]  ← tabs if multiple │
├────────────────────────────────────────────┤
│                                            │
│   <VideoPlayer /> or <AudioPlayer />       │
│   or <PdfViewer />                         │
│                                            │
└────────────────────────────────────────────┘
```

---

## Component imports

```typescript
import { VideoPlayer } from "@/stitch-output/components/media/VideoPlayer";
import { AudioPlayer } from "@/stitch-output/components/media/AudioPlayer";
import { PdfViewer } from "@/stitch-output/components/media/PdfViewer";
```

---

## Tab logic

- If lecture has VIDEO → default tab Video
- If only AUDIO → default Audio
- Hide tabs for media types not present
- Only show media where `uploadStatus === "READY"`

---

## Access denied handling

If media list empty or API 403:
- Message: "You do not have access to this lecture."
- Links: "Enter a code" → `/student/code`, "Browse content" → `/student`

---

## Lecture title

Optional: fetch from content-tree or display lectureId shortened.

---

## Acceptance Criteria

- [ ] Dynamic route `lectureId` from params
- [ ] Tabs switch between player components
- [ ] Passes correct mediaId and lectureId to players
- [ ] PDF gets userEmail from session
- [ ] Back navigation works
- [ ] Loading state while fetching media list
