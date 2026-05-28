export function jsonResponse(
  data: unknown,
  status = 200,
  headers?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

export function errorResponse(
  message: string,
  status = 400,
  errorCode?: string,
  details?: unknown,
): Response {
  return jsonResponse(
    {
      error: message,
      ...(errorCode ? { errorCode } : {}),
      ...(details !== undefined ? { details } : {}),
    },
    status,
  );
}
