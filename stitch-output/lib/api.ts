const BASE =
  typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_APP_URL ?? "");

type CsrfCache = { signed: string; fetchedAt: number };
let csrfCache: CsrfCache | null = null;
const CSRF_CACHE_MS = 5 * 60 * 1000;

async function fetchCsrfSignedToken(): Promise<string> {
  const res = await fetch(`${BASE}/api/csrf`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = (await res.json()) as {
    signedToken?: string;
    csrfToken?: string;
  };
  const signed =
    data.signedToken?.trim() ?? res.headers.get("X-CSRF-Token")?.trim();
  if (!signed) throw new Error("CSRF token unavailable");
  csrfCache = { signed, fetchedAt: Date.now() };
  return signed;
}

async function getCsrfHeader(forceRefresh = false): Promise<string> {
  if (
    !forceRefresh &&
    csrfCache &&
    Date.now() - csrfCache.fetchedAt < CSRF_CACHE_MS
  ) {
    return csrfCache.signed;
  }
  return fetchCsrfSignedToken();
}

function isCsrfError(status: number, data: unknown): boolean {
  if (status !== 403) return false;
  const msg = (data as { error?: string })?.error ?? "";
  return msg.toLowerCase().includes("csrf");
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  async function doRequest(csrfRetry: boolean): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    };

    if (isMutating) {
      headers["X-CSRF-Token"] = await getCsrfHeader(csrfRetry);
    }

    return fetch(`${BASE}${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers,
    });
  }

  let res = await doRequest(false);
  let data: unknown = await res.json().catch(() => ({}));

  if (isMutating && isCsrfError(res.status, data)) {
    csrfCache = null;
    res = await doRequest(true);
    data = await res.json().catch(() => ({}));
  }

  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return data as T;
}
