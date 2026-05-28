import Redis from "ioredis";

const memoryStore = new Map<string, { value: string; expiresAt: number }>();

type RedisGlobal = {
  client: Redis | null;
  unavailable: boolean;
  fallbackLogged: boolean;
};

const globalKey = "__educationCenterRedis" as const;

function redisState(): RedisGlobal {
  const g = globalThis as typeof globalThis & {
    [globalKey]?: RedisGlobal;
  };
  if (!g[globalKey]) {
    g[globalKey] = { client: null, unavailable: false, fallbackLogged: false };
  }
  return g[globalKey];
}

function isRedisConfigured(): boolean {
  if (process.env.REDIS_ENABLED === "false") return false;
  if (process.env.REDIS_ENABLED === "true") {
    return Boolean(process.env.REDIS_URL?.trim());
  }
  // In local dev, use in-memory cache unless Redis is explicitly enabled.
  if (process.env.NODE_ENV === "development") return false;
  return Boolean(process.env.REDIS_URL?.trim());
}

function logRedisFallback(reason: string): void {
  const state = redisState();
  if (state.fallbackLogged) return;
  state.fallbackLogged = true;
  if (process.env.NODE_ENV === "development") {
    console.warn(`[redis] ${reason} — using in-memory cache`);
  }
}

function destroyRedisClient(): void {
  const state = redisState();
  const client = state.client;
  if (!client) return;
  client.removeAllListeners();
  client.disconnect(false);
  state.client = null;
}

function markRedisUnavailable(reason: string): void {
  const state = redisState();
  if (state.unavailable) return;
  state.unavailable = true;
  logRedisFallback(reason);
  destroyRedisClient();
}

function attachErrorHandler(client: Redis): void {
  client.on("error", () => {
    markRedisUnavailable("connection failed");
  });
}

function createRedisClient(): Redis {
  const client = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 0,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null,
    reconnectOnError: () => false,
    autoResubscribe: false,
  });
  attachErrorHandler(client);
  return client;
}

/** @deprecated Use redisRun() — direct access can leak unhandled ioredis errors. */
export function getRedis(): Redis | null {
  if (!isRedisConfigured()) return null;
  const state = redisState();
  if (state.unavailable) return null;
  if (!state.client) {
    state.client = createRedisClient();
  }
  return state.client;
}

export async function redisRun<T>(
  op: (client: Redis) => Promise<T>,
): Promise<T | null> {
  if (!isRedisConfigured()) return null;
  const state = redisState();
  if (state.unavailable) return null;

  const client = state.client ?? createRedisClient();
  state.client = client;

  try {
    if (client.status === "wait") {
      await client.connect();
    }
    return await op(client);
  } catch {
    markRedisUnavailable("operation failed");
    return null;
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const value = await redisRun((client) => client.get(key));
  if (value !== null) return value;

  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  const ok = await redisRun((client) =>
    client.setex(key, ttlSeconds, value).then(() => true),
  );
  if (ok) return;

  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function cacheDel(key: string): Promise<void> {
  await redisRun((client) => client.del(key));
  memoryStore.delete(key);
}
