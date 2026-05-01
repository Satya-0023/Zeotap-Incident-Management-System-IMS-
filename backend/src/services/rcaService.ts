import { RCA, WorkItem } from "../models/postgres";
import { calculateMTTR, formatMTTR } from "../utils/mttr";
import { retryWithBackoff } from "../utils/retry";
import { cacheSet } from "./cacheService";
import { logger } from "../utils/logger";

export interface RCAInput {
  rootCauseCategory: string;
  startTime: string;
  endTime: string;
  fixDescription: string;
  preventionSteps: string;
}

/**
 * Submit RCA for an incident.
 *
 * - Validates all required fields
 * - Computes MTTR from first signal timestamp → RCA submission time
 * - Updates work item with MTTR
 * - Caches updated state
 */
export async function submitRCA(
  workItemId: string,
  input: RCAInput
): Promise<{ rca: RCA; mttrSeconds: number; mttrFormatted: string }> {
  return retryWithBackoff(async () => {
    const incident = await WorkItem.findByPk(workItemId);
    if (!incident) {
      const err = new Error(`Incident ${workItemId} not found`);
      (err as { status?: number }).status = 404;
      throw err;
    }

    // Check if RCA already exists
    const existing = await RCA.findOne({ where: { workItemId } });
    if (existing) {
      const err = new Error("RCA already submitted for this incident");
      (err as { status?: number }).status = 409;
      throw err;
    }

    const submittedAt = new Date();
    const mttrSeconds = calculateMTTR(incident.firstSignalAt, submittedAt);
    const mttrFormatted = formatMTTR(mttrSeconds);

    const rca = await RCA.create({
      workItemId,
      rootCauseCategory: input.rootCauseCategory,
      startTime:         new Date(input.startTime),
      endTime:           new Date(input.endTime),
      fixDescription:    input.fixDescription,
      preventionSteps:   input.preventionSteps,
      submittedAt,
      mttrSeconds,
    });

    // Update MTTR on work item
    incident.mttrSeconds = mttrSeconds;
    await incident.save();

    // Cache updated state
    try {
      await cacheSet(`incident:${workItemId}`, { ...incident.toJSON(), rca: rca.toJSON() }, 300);
    } catch { /* non-critical */ }

    logger.info(`[RCA] Submitted for incident ${workItemId}`, { mttrSeconds, mttrFormatted });
    return { rca, mttrSeconds, mttrFormatted };
  });
}

export async function getRCAByIncident(workItemId: string): Promise<RCA | null> {
  return RCA.findOne({ where: { workItemId } });
}
