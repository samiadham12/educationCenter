/** Opaque URI in m3u8 — real target is resolved by the secure Hls.js loader + `/chunk`. */
export const OPAQUE_HLS_URI = "c";

export function rewriteHlsPlaylistOpaque(text: string): string {
  return text
    .replace(/#EXT-X-KEY:([^,\n]*,)*URI="([^"]+)"/g, (_match, prefix) => {
      const safePrefix = prefix ?? "";
      return `#EXT-X-KEY:${safePrefix}URI="${OPAQUE_HLS_URI}"`;
    })
    .replace(/^([^#\n][^\n]*)$/gm, (line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;
      if (/^https?:\/\//i.test(trimmed)) return line;
      if (!/\.ts$/i.test(trimmed)) return line;
      return OPAQUE_HLS_URI;
    });
}
