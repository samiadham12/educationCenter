---
name: DRM video protection
overview: Migrate video playback from standard HLS to real DRM (Widevine) so that even if manifest/segment URLs are captured, the content cannot be decrypted or played outside an authorized browser. This is the only practical way to reach “cannot be downloaded” against extensions like DownloadHelper.
todos:
  - id: locate-transcode-outputs
    content: Determine the current output of `transcode.service.ts` (HLS only vs other formats) and prepare the pipeline for adding DASH-CENC outputs.
    status: cancelled
  - id: add-media-drm-fields
    content: Add DRM fields to `Media.model.ts` and decide where to store keys/metadata.
    status: cancelled
  - id: implement-license-endpoint
    content: Add `POST /api/drm/widevine/license` and tie it to the session + `canAccessLecture` + the DRM provider.
    status: cancelled
  - id: serve-dash-manifest
    content: Serve `manifest.mpd` and CMAF segments from storage via the API (with `no-store`).
    status: cancelled
  - id: swap-player-to-shaka
    content: Update `VideoPlayer.tsx` to play DASH DRM via Shaka with an HLS fallback.
    status: cancelled
isProject: false
---

## Goal
Prevent downloading / replaying the video outside the platform even if the user uses DownloadHelper. This requires **real DRM** (EME/Widevine). Any non‑DRM approach (tokens/origin checks/disable right click) is still bypassable.

## Current state (as implemented)
- Video playback uses `hls.js` and requests a manifest from:
  - `[f:\samy\programming\educationCenter\stitch-output\components\media\VideoPlayer.tsx](f:\samy\programming\educationCenter\stitch-output\components\media\VideoPlayer.tsx)` around line 78: `/api/stream/${mediaId}/manifest`
- The API returns a `manifestUrl` with a `token` query and rewrites the playlist to point to segments under `/api/stream/.../segment/...`.
- `authGuard` and `roleGuard` allow `/api/stream/*?token=...` without a session; access is then validated inside `validateStreamAccess`.
- This is great for streaming, but it is **not DRM**: an extension can collect the playlist + segments and download them.

## Proposed design (Widevine DRM)
- **Package** video as DASH (MPD) with CENC (common encryption) and PSSH/KID metadata.
- **Play** video via an EME-capable player such as Shaka Player (instead of HLS.js) for the DRM path.
- **License**: add an internal endpoint `/api/drm/widevine/license` that proxies to a DRM provider (or Widevine license server) after validating the student session and lecture access.
- **Authorization binding**: licenses are only issued to an authenticated user who passes `canAccessLecture` for the same `mediaId`.

## Required project changes (specific files)
- **Video player**
  - Update `[f:\samy\programming\educationCenter\stitch-output\components\media\VideoPlayer.tsx](f:\samy\programming\educationCenter\stitch-output\components\media\VideoPlayer.tsx)` so that:
    - If `drmEnabled=true` → use Shaka Player + an MPD URL + configure the Widevine license URL.
    - Otherwise → keep the current HLS flow as a fallback.
- **Media model**
  - Update `[f:\samy\programming\educationCenter\src\features\media\models\Media.model.ts](f:\samy\programming\educationCenter\src\features\media\models\Media.model.ts)` to add fields such as:
    - `drmEnabled: boolean`
    - `dashManifestKey?: string`
    - `drmKID?: string`
    - `drmPssh?: string` (or enough metadata for Shaka)
- **Post-upload processing / transcoding**
  - Update `[f:\samy\programming\educationCenter\src\features\media\services\transcode.service.ts](f:\samy\programming\educationCenter\src\features\media\services\transcode.service.ts)` to produce:
    - Encrypted DASH-CMAF (CENC) + `manifest.mpd`
    - (Optional) non-DRM HLS as a fallback
  - Update `[f:\samy\programming\educationCenter\src\features\media\services\media-upload.service.ts](f:\samy\programming\educationCenter\src\features\media\services\media-upload.service.ts)` if we need to attach keys/metadata after transcoding succeeds.
- **New DRM license API**
  - Add new handlers in the router (following the project pattern via `dispatchApi`) in:
    - `[f:\samy\programming\educationCenter\src\app\api\route-handlers-extra.ts](f:\samy\programming\educationCenter\src\app\api\route-handlers-extra.ts)` or `route-handlers.ts`
  - Proposed route: `POST /api/drm/widevine/license?mediaId=...`
  - Behavior:
    - Requires a session (no bypass like stream routes)
    - Validates `canAccessLecture(userId, lectureId)` via `Media` → `lectureId`
    - Forwards the Widevine challenge to the DRM provider and returns the license response as-is
- **Serving MPD/segments**
  - Extend `/api/stream/...` or create `/api/drm-stream/...` to serve DASH manifests/segments via `getProxiedObject` with `no-store`.

## Environment / secrets
- Add variables such as:
  - `DRM_PROVIDER_URL`
  - `DRM_PROVIDER_API_KEY` (or equivalent credentials)
  - (Provider-dependent) `WIDEVINE_KEY_ID_SET` / `SIGNING_KEY`

## Phased rollout to reduce risk
- **Phase 1 (Widevine on Chrome/Edge/Android only)**
  - Produce DRM-protected DASH and play it via Shaka.
  - Keep the current HLS path as a fallback for unsupported devices.
- **Phase 2 (iOS/Safari)**
  - Add FairPlay (HLS SAMPLE-AES + FPS license endpoint) if you need iPhone/iPad with the same level of protection.

## Important notes
- DRM prevents “downloading and playing the content” outside the platform, but it cannot 100% prevent recording via screen capture / HDMI capture.
- Extensions like DownloadHelper will fail because the assets are encrypted and there is no valid license outside an authorized browser.
