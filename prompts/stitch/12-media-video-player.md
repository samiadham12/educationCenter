# Google Stitch Prompt — Protected Video Player Component

> Prerequisite: `00-project-overview.md`. Used inside watch page.

---

## Task

Generate a **protected HLS video player** component with speed controls, progress tracking, and anti-download measures.

**Output file:** `stitch-output/components/media/VideoPlayer.tsx`

**Usage:** `import { VideoPlayer } from "@/stitch-output/components/media/VideoPlayer"`

---

## Props

```typescript
interface VideoPlayerProps {
  lectureId: string;
  mediaId: string;
  onError?: (message: string) => void;
}
```

---

## API Flow

### Step 1 — Get stream manifest URL

```http
GET /api/stream/:mediaId/manifest
```

**Response:**
```json
{
  "manifestUrl": "/api/stream/665f.../playlist.m3u8?token=eyJ...",
  "token": "eyJ..."
}
```

Use `manifestUrl` as HLS source (relative path, same origin).

### Step 2 — Playback

Load with **hls.js** (npm: `hls.js`):

```typescript
import Hls from "hls.js";

if (Hls.isSupported()) {
  const hls = new Hls({ xhrSetup: (xhr) => { xhr.withCredentials = true; } });
  hls.loadSource(manifestUrl);
  hls.attachMedia(videoElement);
} else if (video.canPlayType("application/vnd.apple.mpegurl")) {
  video.src = manifestUrl;
}
```

**NEVER** set `video.src` to R2 or external storage URL.

### Step 3 — Resume position

```http
GET /api/progress/:mediaId
```

**Response:**
```json
{
  "progress": {
    "lastPosition": 120,
    "watchedSeconds": 300,
    "totalDuration": 3600
  }
}
```

On loadedmetadata → `video.currentTime = lastPosition`.

### Step 4 — Heartbeat (every 1 second while playing)

```http
POST /api/progress/heartbeat
```

**Request:**
```json
{
  "mediaId": "665f...",
  "lectureId": "665f...",
  "currentTimeSeconds": 125,
  "durationSeconds": 3600,
  "isPlaying": true
}
```

Send only when `!video.paused && !document.hidden`.

When paused or tab hidden → send `isPlaying: false` or skip.

---

## Speed Controls (REQUIRED)

Buttons: **1x | 1.25x | 1.5x | 2x | 2.5x | 3x**

```typescript
video.playbackRate = speed;
```

Persist last speed in `localStorage` key `video-playback-rate`.

Highlight active speed button.

---

## Anti-Download (REQUIRED)

1. `onContextMenu={(e) => e.preventDefault()}` on video
2. `controlsList="nodownload noplaybackrate"` — then re-add rate via custom buttons
3. No `download` attribute anywhere
4. Do not expose token in DOM attributes (keep in memory only)
5. CSS: `user-select: none` on player container

---

## UI Layout

```
┌────────────────────────────────────────────┐
│                                            │
│              [ Video Area ]                │
│                                            │
├────────────────────────────────────────────┤
│  Speed: [1x] [1.25x] [1.5x] [2x] [2.5x] [3x] │
│  Progress saved automatically              │
└────────────────────────────────────────────┘
```

---

## States

- Loading manifest
- Buffering spinner
- Error: "Unable to play video" + retry
- Playing

---

## Acceptance Criteria

- [ ] Uses hls.js with credentials
- [ ] Heartbeat every 1s while playing
- [ ] All 6 speed options work
- [ ] Resumes from lastPosition
- [ ] No direct R2 URLs
- [ ] Cleanup hls instance on unmount
