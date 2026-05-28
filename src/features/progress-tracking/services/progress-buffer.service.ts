import mongoose from "mongoose";
import { Progress } from "@/features/progress-tracking/models/Progress.model";
import { redisRun } from "@/shared/lib/redis";

const BUFFER_KEY = "progress:buffer";
const FLUSH_LOCK_KEY = "progress:last_flush";
const FLUSH_INTERVAL_MS = 10_000;

type HeartbeatPayload = {
  userId: string;
  mediaId: string;
  lectureId: string;
  currentTimeSeconds: number;
  durationSeconds: number;
};

const memoryBuffer: HeartbeatPayload[] = [];
let lastMemoryFlush = 0;

export async function bufferProgressHeartbeat(
  payload: HeartbeatPayload,
): Promise<void> {
  const serialized = JSON.stringify({ ...payload, ts: Date.now() });

  const usedRedis = await redisRun(async (redis) => {
    await redis.zadd(BUFFER_KEY, Date.now(), serialized);
    const lastFlush = await redis.get(FLUSH_LOCK_KEY);
    const shouldFlush =
      !lastFlush || Date.now() - Number(lastFlush) >= FLUSH_INTERVAL_MS;
    if (shouldFlush) {
      await flushProgressBuffer();
    }
    return true;
  });

  if (usedRedis) return;

  memoryBuffer.push(payload);
  if (Date.now() - lastMemoryFlush >= FLUSH_INTERVAL_MS) {
    await flushProgressBuffer();
  }
}

export async function flushProgressBuffer(): Promise<number> {
  const payloads: HeartbeatPayload[] = [];

  await redisRun(async (redis) => {
    const items = await redis.zrange(BUFFER_KEY, 0, -1);
    if (items.length) {
      await redis.del(BUFFER_KEY);
      for (const item of items) {
        const parsed = JSON.parse(item) as HeartbeatPayload & { ts?: number };
        payloads.push(parsed);
      }
      await redis.set(FLUSH_LOCK_KEY, String(Date.now()));
    }
    return true;
  });

  if (memoryBuffer.length) {
    payloads.push(...memoryBuffer.splice(0, memoryBuffer.length));
    lastMemoryFlush = Date.now();
  }

  const latestByKey = new Map<string, HeartbeatPayload>();
  for (const p of payloads) {
    const key = `${p.userId}:${p.mediaId}`;
    const existing = latestByKey.get(key);
    if (
      !existing ||
      p.currentTimeSeconds > existing.currentTimeSeconds
    ) {
      latestByKey.set(key, p);
    }
  }

  let flushed = 0;
  for (const p of latestByKey.values()) {
    const completionPercent = Math.min(
      100,
      (p.currentTimeSeconds / p.durationSeconds) * 100,
    );

    const filter = {
      userId: new mongoose.Types.ObjectId(p.userId),
      mediaId: new mongoose.Types.ObjectId(p.mediaId),
    };
    const existing = await Progress.findOne(filter);
    const watchedSeconds = Math.max(
      existing?.watchedSeconds ?? 0,
      p.currentTimeSeconds,
    );

    await Progress.findOneAndUpdate(
      filter,
      {
        watchedSeconds,
        lastPosition: p.currentTimeSeconds,
        lectureId: new mongoose.Types.ObjectId(p.lectureId),
        totalDuration: p.durationSeconds,
        completionPercent,
        isCompleted: completionPercent >= 95,
        updatedAt: new Date(),
      },
      { upsert: true },
    );
    flushed++;
  }

  return flushed;
}
