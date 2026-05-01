import { z } from "zod";
import { streamAdd } from "../queues/redisStream";
import { logger } from "../utils/logger";

/**
 * Signal payload schema — validated on ingestion.
 */
export const SignalSchema = z.object({
  componentId:   z.string().min(1).max(100),
  componentType: z.string().min(1).max(50),
  timestamp:     z.string().datetime({ offset: true }).optional(),
  message:       z.string().min(1).max(500),
});

export type SignalPayload = z.infer<typeof SignalSchema>;

/**
 * Push signal to Redis Streams queue.
 * API returns immediately (non-blocking). Worker processes asynchronously.
 */
export async function ingestSignal(payload: SignalPayload): Promise<string> {
  const timestamp = payload.timestamp ?? new Date().toISOString();

  const streamPayload: Record<string, string> = {
    componentId:   payload.componentId,
    componentType: payload.componentType,
    timestamp,
    message:       payload.message,
    receivedAt:    new Date().toISOString(),
  };

  const messageId = await streamAdd(streamPayload);
  logger.debug(`[SIGNAL] Queued to stream`, { messageId, componentId: payload.componentId });
  return messageId;
}
