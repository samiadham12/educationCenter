# Google Stitch Prompt — Admin Media Upload Page

> Prerequisite: `00-project-overview.md` + admin layout.

---

## Task

Generate **media upload page** with cascading hierarchy selectors and direct-to-R2 upload flow.

**Output file:** `stitch-output/admin/uploads/page.tsx`

**Route:** `/admin/uploads`

---

## Upload Flow (CRITICAL)

```
1. User selects: Year → Term → Subject → Section → Lecture
2. User selects file type tab: VIDEO | AUDIO | PDF
3. User drops file
4. POST /api/media/presign  → { mediaId, uploadUrl, fileKey }
5. PUT uploadUrl (file binary, NO credentials cookie to R2)
6. POST /api/media/confirm → { media, message }
7. Show success + processing status
```

**NEVER** put R2 URL in iframe/video permanently. Upload PUT only.

---

## API Contracts

### Cascade loaders

```http
GET /api/academic-years
GET /api/terms?academicYearId={yearId}
GET /api/subjects?termId={termId}
GET /api/sections?subjectId={subjectId}
GET /api/lectures?sectionId={sectionId}
```

**Lectures response includes codes:**
```json
{
  "lectures": [{ "_id": "...", "title": "Lecture 1 - Intro" }],
  "codes": [{ "code": "X7K9M2PL5VQ1", "lectureId": "..." }]
}
```

### Presign

```http
POST /api/media/presign
```

**Request:**
```json
{
  "lectureId": "665f...",
  "fileName": "intro-video.mp4",
  "fileType": "VIDEO",
  "mimeType": "video/mp4",
  "fileSize": 52428800
}
```

`fileType`: `"VIDEO"` | `"AUDIO"` | `"PDF"`

**Limits:**
| Type | Max | MIME |
|------|-----|------|
| VIDEO | 2 GB | video/mp4, video/webm |
| AUDIO | 500 MB | audio/mpeg, audio/mp4 |
| PDF | 50 MB | application/pdf |

**Response:**
```json
{
  "mediaId": "665f...",
  "uploadUrl": "https://....r2.cloudflarestorage.com/...",
  "fileKey": "videos/665f.../intro-video.mp4",
  "expiresAt": "2026-05-25T12:15:00.000Z"
}
```

### Confirm

```http
POST /api/media/confirm
```

**Request:**
```json
{
  "mediaId": "665f...",
  "durationSeconds": 3600
}
```

`durationSeconds` optional — extract from video/audio metadata client-side if possible.

**Response:**
```json
{
  "media": {
    "_id": "...",
    "uploadStatus": "PROCESSING",
    "fileType": "VIDEO"
  },
  "message": "Processing started"
}
```

Poll `GET /api/media?lectureId={id}` until `uploadStatus === "READY"`.

---

## UI Layout

### Breadcrumb cascade (horizontal on desktop, vertical on mobile)

5 dependent `<select>` dropdowns — each disabled until parent selected.

### File type tabs

`[ Video ] [ Audio ] [ PDF ]` — changes `accept` attribute on file input.

### Drop zone

- Drag & drop area with dashed border
- Click to browse
- Show file name, size, type after selection
- **Progress bar** during PUT upload (xhr/fetch progress if possible)

### Status panel

After confirm: show chip `PROCESSING` → poll every 3s → `READY` (green) or `FAILED` (red).

---

## Acceptance Criteria

- [ ] Cannot upload without lecture selected
- [ ] File size validated client-side before presign
- [ ] Progress bar during upload
- [ ] Error toast on presign/upload/confirm failure
- [ ] Lists existing media for selected lecture below upload zone
