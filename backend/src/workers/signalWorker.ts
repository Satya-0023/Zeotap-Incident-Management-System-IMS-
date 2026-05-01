import {
  initConsumerGroup,
  streamReadGroup,
  streamAck,
  checkDebounce,
  setDebounce,
} from "../queues/redisStream";
import { Signal } from "../models/mongo/Signal";
import {
  createIncident,
  attachSignalToIncident,
} from "../services/incidentService";
import { AlertContext } from "../patterns/strategy/AlertContext";
import { retryWithBackoff } from "../utils/retry";
import { incrementSignalCount, logger } from "../utils/logger";
import { config } from "../config";

let isRunning = false;

/**
 * Signal Worker — consumes from Redis Streams consumer group.
 *
 * For each signal:
 *   1. Write raw signal to MongoDB (NoSQL append-only log)
 *   2. Check Redis debounce key (SET NX EX 10s)
 *      - If key exists  → attach signal to existing incident (signal_count++)
 *      - If key missing → create new work item in PostgreSQL
 *   3. Update Redis cache with incident state
 *   4. XACK the message (remove from pending)
 *
 * Backpressure: Redis Streams hold messages. Worker processes at controlled
 * batch rate (WORKER_BATCH_SIZE per poll). Producer and consumer are decoupled.
 */
export async function startWorker(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  logger.info("[WORKER] Initializing consumer group...");
  await initConsumerGroup();
  logger.info("[WORKER] Starting signal processing loop...");

  while (isRunning) {
    try {
      const messages = await streamReadGroup(config.workerBatchSize);

      if (messages.length === 0) continue;

      // Process all messages in the batch concurrently (bounded by batch size)
      await Promise.allSettled(
        messages.map((msg) => processMessage(msg.id, msg.data))
      );
    } catch (err) {
      logger.error("[WORKER] Poll loop error", { error: (err as Error).message });
      await sleep(1000); // brief pause before retry
    }
  }
}

export function stopWorker(): void {
  isRunning = false;
  logger.info("[WORKER] Stopped");
}

async function processMessage(
  messageId: string,
  data: Record<string, string>
): Promise<void> {
  const { componentId, componentType, timestamp, message, receivedAt } = data;

  try {
    // ── Step 1: Persist raw signal to MongoDB ─────────────────────────────
    const signalTimestamp = new Date(timestamp);

    // ── Step 2: Debounce check (Redis atomic SET NX EX) ──────────────────
    const existingIncidentId = await checkDebounce(componentId);

    let incidentId: string;

    if (existingIncidentId) {
      // Debounce hit — attach to existing incident
      incidentId = existingIncidentId;
      await retryWithBackoff(() => attachSignalToIncident(incidentId));
      logger.debug(`[WORKER] Signal debounced → incident ${incidentId}`, { componentId });
    } else {
      // New incident — determine priority via Strategy pattern
      const priority = AlertContext.getPriority(componentType);
      const incident = await retryWithBackoff(() =>
        createIncident(componentId, componentType, priority, signalTimestamp)
      );
      incidentId = incident.id;

      // Set debounce key — atomic, expires in 10s
      await setDebounce(componentId, incidentId, config.debounceTtlSeconds);
      logger.info(`[WORKER] New incident created #${incidentId}`, { componentId, priority });
    }

    // ── Step 3: Persist raw signal to MongoDB with linked incidentId ──────
    await retryWithBackoff(() =>
      Signal.create({
        componentId,
        componentType,
        timestamp:       signalTimestamp,
        message,
        incidentId,
        streamMessageId: messageId,
        receivedAt:      new Date(receivedAt),
      })
    );

    // ── Step 4: Acknowledge message (remove from pending list) ────────────
    await streamAck(messageId);

    // ── Observability counter ─────────────────────────────────────────────
    incrementSignalCount();
  } catch (err) {
    logger.error(`[WORKER] Failed to process message ${messageId}`, {
      error: (err as Error).message,
      componentId,
    });
    // NOTE: Not ACKing failed messages — they remain in PEL for reprocessing
    // In production: implement dead-letter queue after N retries
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
