/** Must match `src/shared/utils/stream-client-guard.ts` on the server. */
export const STREAM_CLIENT_HEADER = "X-Stream-Client";
export const STREAM_CLIENT_VALUE = "edu-player";

export function streamClientHeaders(): Record<string, string> {
  return { [STREAM_CLIENT_HEADER]: STREAM_CLIENT_VALUE };
}
