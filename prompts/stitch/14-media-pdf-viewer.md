# Google Stitch Prompt — Protected PDF Viewer Component

> Prerequisite: `00-project-overview.md`.

---

## Task

Generate **protected inline PDF viewer** with user watermark — no download button.

**Output file:** `stitch-output/components/media/PdfViewer.tsx`

---

## Props

```typescript
interface PdfViewerProps {
  mediaId: string;
  userEmail: string;
  onError?: (message: string) => void;
}
```

---

## API

```http
GET /api/stream/pdf/:mediaId
```

Uses session cookie for auth (credentials: include). Returns PDF binary stream with `Content-Disposition: inline`.

**Do NOT** use signed R2 URL in iframe src.

### Recommended approach

```typescript
const res = await fetch(`/api/stream/pdf/${mediaId}`, { credentials: "include" });
const blob = await res.blob();
const url = URL.createObjectURL(blob);
// use in iframe or react-pdf
```

Revoke object URL on unmount.

---

## UI Layout

```
┌─────────────────────────────────────────────┐
│  📄 Lecture Document          [pages 1/N]   │
├─────────────────────────────────────────────┤
│                                             │
│   ┌─────────────────────────────────────┐ │
│   │                                     │ │
│   │         PDF CONTENT HERE            │ │
│   │                                     │ │
│   │    watermark: user@email.com        │ │
│   │                                     │ │
│   └─────────────────────────────────────┘ │
│                                             │
│  ⚠ Viewing only — downloading disabled     │
└─────────────────────────────────────────────┘
```

---

## Watermark (REQUIRED)

Overlay div on top of PDF container:

```css
position: absolute;
inset: 0;
pointer-events: none;
background: repeating-linear-gradient(
  -45deg,
  transparent,
  transparent 100px,
  rgba(255,255,255,0.03) 100px,
  rgba(255,255,255,0.03) 200px
);
```

Center text (repeated or diagonal):
`{userEmail}` — opacity 0.15, font-size 18px, rotate -30deg.

---

## Anti-Download

1. **No download button** in UI
2. `@media print { display: none }` on container
3. `onContextMenu` preventDefault
4. Do not provide blob URL in visible DOM (use iframe src with blob URL only in memory — acceptable)
5. Disable keyboard shortcuts Ctrl+S where possible (keydown preventDefault)

---

## PDF Rendering Options

**Option A:** `<iframe src={blobUrl} />` — simplest

**Option B:** `react-pdf` package — better page controls

Prefer Option A for simplicity unless page navigation needed.

---

## Loading & Error

- Skeleton while fetching
- Error: "Document could not be loaded"
- Retry button

---

## Acceptance Criteria

- [ ] Fetches PDF via API proxy only
- [ ] Watermark shows user email
- [ ] No download button
- [ ] Print disabled via CSS
- [ ] Blob URL revoked on unmount
- [ ] Works on mobile (scrollable iframe)
