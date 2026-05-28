# Google Stitch Prompt — Protected Audio Player Component

> Prerequisite: `00-project-overview.md` + `12-media-video-player.md` (same patterns).

---

## Task

Generate **protected audio player** for lecture audio files.

**Output file:** `stitch-output/components/media/AudioPlayer.tsx`

---

## Props

```typescript
interface AudioPlayerProps {
  lectureId: string;
  mediaId: string;
  title?: string;
  onError?: (message: string) => void;
}
```

---

## API Flow

Same as video player:

1. `GET /api/stream/:mediaId/manifest` → HLS manifest URL
2. `GET /api/progress/:mediaId` → resume `lastPosition`
3. `POST /api/progress/heartbeat` every 1s while playing

For audio-only HLS, hls.js still applies.

Alternative fallback: if manifest fails, try manifest endpoint then stream segments.

---

## UI Design — Audio Card

```
┌─────────────────────────────────────────────┐
│  🎵  Lecture Audio Title                    │
│  ───────────────────────────────────────  │
│  [▶ Play/Pause]  ━━━━━●━━━━━  12:34/45:00 │
│                                             │
│  Speed: [1x] [1.25x] [1.5x] [2x] [2.5x] [3x]│
└─────────────────────────────────────────────┘
```

### Optional: waveform

Use CSS-only animated bars during playback (no external lib required).

---

## Speed Controls

Identical to video: 1, 1.25, 1.5, 2, 2.5, 3 — `playbackRate` + localStorage `audio-playback-rate`.

---

## Anti-Download

- No download button
- No exposed direct media URL
- Context menu disabled on controls
- `controlsList="nodownload"` on audio element

---

## Hidden audio element

```html
<audio ref={audioRef} preload="metadata" />
```

Use hls.js attached to audio element same as video.

---

## Acceptance Criteria

- [ ] Play/pause toggle
- [ ] Seek bar (native audio controls or custom)
- [ ] Speed controls all 6 rates
- [ ] Heartbeat every 1 second
- [ ] Resume from lastPosition
- [ ] Visually distinct from video player (audio-focused UI)
