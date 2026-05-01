import Redis from "ioredis";
import { config } from "../config";
import { logger } from "../utils/logger";

// ─── Redis Clients ────────────────────────────────────────────────────────────
// Separate clients: one for blocking read (worker), one for non-blocking ops
export const redisClient = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

export const redisWorkerClient = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null, // unlimited for blocking reads
  enableReadyCheck: true,
  lazyConnect: false,
});

redisClient.on("connect", () => logger.info("[REDIS] Client connected"));
redisClient.on("error", (err) => logger.error("[REDIS] Client error", { error: err.message }));
redisWorkerClient.on("connect", () => logger.info("[REDIS] Worker client connected"));
redisWorkerClient.on("error", (err) => logger.error("[REDIS] Worker client error", { error: err.message }));

// ─── Stream Operations ────────────────────────────────────────────────────────

/**
 * Add a signal to the Redis Stream (XADD).
 * Returns the message ID.
 */
export async function streamAdd(payload: Record<string, string>): Promise<string> {
  const flatArgs: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    flatArgs.push(key, value);
  }
  const id = await redisClient.xadd(config.streamName, "*", ...flatArgs);
  return id as string;
}

/**
 * Initialize the consumer group.
 * Creates stream + group if they don't exist (MKSTREAM).
 */
export async function initConsumerGroup(): Promise<void> {
  try {
    await redisClient.xgroup(
      "CREATE",
      config.streamName,
      config.consumerGroup,
      "0",
      "MKSTREAM"
    );
    logger.info(`[REDIS STREAM] Consumer group '${config.consumerGroup}' created`);
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message?.includes("BUSYGROUP")) {
      logger.info(`[REDIS STREAM] Consumer group '${config.consumerGroup}' already exists`);
    } else {
      throw err;
    }
  }
}

/**
 * Read messages from the stream as a consumer group member.
 * Uses XREADGROUP — blocking with 2s timeout for backpressure-friendly polling.
 */
export type StreamMessage = {
  id: string;
  data: Record<string, string>;
};

export async function streamReadGroup(
  batchSize: number,
  blockMs = 2000
): Promise<StreamMessage[]> {
  const response = await redisWorkerClient.xreadgroup(
    "GROUP",
    config.consumerGroup,
    config.consumerName,
    "COUNT",
    batchSize,
    "BLOCK",
    blockMs,
    "STREAMS",
    config.streamName,
    ">"
  );

  if (!response) return [];

  const [, messages] = (response as [string, [string, string[]][]][])[0];
  return messages.map(([id, fields]) => {
    const data: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      data[fields[i]] = fields[i + 1];
    }
    return { id, data };
  });
}

/**
 * Acknowledge a processed message (XACK).
 */
export async function streamAck(messageId: string): Promise<void> {
  await redisClient.xack(config.streamName, config.consumerGroup, messageId);
}

// ─── Debouncing ───────────────────────────────────────────────────────────────

/**
 * Atomic debounce check using SET NX EX.
 * Returns existing incidentId if debounce key exists, null if new incident.
 */
export async function checkDebounce(componentId: string): Promise<string | null> {
  return redisClient.get(`debounce:${componentId}`);
}

export async function setDebounce(
  componentId: string,
  incidentId: string,
  ttlSeconds: number
): Promise<void> {
  // SET key value EX ttl NX — atomic, only sets if not exists
  await redisClient.set(`debounce:${componentId}`, incidentId, "EX", ttlSeconds);
}

// ─── Cache Operations ─────────────────────────────────────────────────────────

export async function cacheSet(key: string, value: object, ttlSeconds = 300): Promise<void> {
  await redisClient.set(`cache:${key}`, JSON.stringify(value), "EX", ttlSeconds);
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redisClient.get(`cache:${key}`);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function cacheDel(key: string): Promise<void> {
  await redisClient.del(`cache:${key}`);
}

// ─── Health Check ─────────────────────────────────────────────────────────────
export async function redisHealth(): Promise<boolean> {
  try {
    const pong = await redisClient.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}
