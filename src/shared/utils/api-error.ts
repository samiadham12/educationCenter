import { errorResponse } from "@/shared/utils/response";

function isMongoConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const name = err.name;
  const msg = err.message.toLowerCase();
  return (
    name === "MongooseServerSelectionError" ||
    name === "MongoServerSelectionError" ||
    name === "MongoNetworkError" ||
    msg.includes("econnrefused") ||
    msg.includes("mongoserverselectionerror") ||
    msg.includes("connect econnrefused") ||
    msg.includes("mongodb_uri is not defined")
  );
}

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 11000
  );
}

export function apiErrorToResponse(
  err: unknown,
  context?: { method?: string; path?: string },
): Response {
  if (context?.method && context?.path) {
    console.error(`[api] ${context.method} ${context.path}`, err);
  } else {
    console.error("[api]", err);
  }

  if (isMongoConnectionError(err)) {
    return errorResponse(
      "Database is unavailable. Start MongoDB and check MONGODB_URI in .env.local.",
      503,
    );
  }

  if (isDuplicateKeyError(err)) {
    return errorResponse(
      "A record with this value already exists (duplicate key).",
      409,
    );
  }

  if (err instanceof Error && process.env.NODE_ENV !== "production") {
    return errorResponse(err.message, 500);
  }

  return errorResponse("Internal server error", 500);
}
