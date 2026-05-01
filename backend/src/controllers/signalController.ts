import { Request, Response, NextFunction } from "express";
import { SignalSchema, ingestSignal } from "../services/signalService";
import { logger } from "../utils/logger";

/**
 * POST /signals
 *
 * Signal payload:
 * {
 *   "componentId":   "CACHE_CLUSTER_01",
 *   "componentType": "CACHE",
 *   "timestamp":     "2026-05-01T10:00:00Z",  // optional, defaults to now
 *   "message":       "Latency spike detected"
 * }
 *
 * Returns 202 Accepted immediately — processing is async via Redis Streams.
 */
export async function ingestSignalHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = SignalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid signal payload",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const messageId = await ingestSignal(parsed.data);

    res.status(202).json({
      accepted: true,
      messageId,
      message: "Signal queued for async processing",
    });
  } catch (err) {
    logger.error("[SIGNAL] Ingestion error", { error: (err as Error).message });
    next(err);
  }
}
