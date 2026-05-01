import { WorkItem, RCA } from "../models/postgres";
import { IncidentStatus } from "../models/postgres/WorkItem";
import { IncidentStateMachine, InvalidTransitionError, RCARequiredError } from "../patterns/state/IncidentStateMachine";
import { cacheSet, cacheDel } from "./cacheService";
import { retryWithBackoff } from "../utils/retry";
import { logger } from "../utils/logger";
import { sequelize } from "../models/postgres/db";

/**
 * Create a new incident (work item) in PostgreSQL.
 */
export async function createIncident(
  componentId: string,
  componentType: string,
  priority: string,
  firstSignalAt: Date
): Promise<WorkItem> {
  return retryWithBackoff(async () => {
    const incident = await WorkItem.create({
      componentId,
      componentType,
      status: "OPEN",
      priority: priority as WorkItem["priority"],
      firstSignalAt,
      signalCount: 1,
    });
    await refreshIncidentCache(incident);
    logger.info(`[INCIDENT] Created #${incident.id}`, { componentId, priority });
    return incident;
  });
}

/**
 * Increment signal count on an existing incident.
 * Uses atomic SQL UPDATE to prevent race conditions.
 */
export async function attachSignalToIncident(incidentId: string): Promise<void> {
  await retryWithBackoff(async () => {
    await sequelize.query(
      `UPDATE work_items SET signal_count = signal_count + 1, updated_at = NOW() WHERE id = :id`,
      { replacements: { id: incidentId } }
    );
  });
}

/**
 * Transition incident to a new state.
 * Uses optimistic locking (version column) to prevent race conditions.
 */
export async function transitionIncident(
  incidentId: string,
  newStatus: IncidentStatus
): Promise<WorkItem> {
  return retryWithBackoff(async () => {
    const incident = await WorkItem.findByPk(incidentId);
    if (!incident) {
      const err = new Error(`Incident ${incidentId} not found`);
      (err as { status?: number }).status = 404;
      throw err;
    }

    const hasRCA = !!(await RCA.findOne({ where: { workItemId: incidentId } }));
    const machine = new IncidentStateMachine(incident.status);

    try {
      machine.transition(newStatus, hasRCA);
    } catch (err) {
      if (err instanceof InvalidTransitionError || err instanceof RCARequiredError) {
        throw err;
      }
      throw err;
    }

    incident.status = newStatus;
    await incident.save(); // Sequelize optimistic lock: throws OptimisticLockError on version mismatch

    await refreshIncidentCache(incident);
    logger.info(`[INCIDENT] ${incidentId} transitioned to ${newStatus}`);
    return incident;
  });
}

/**
 * Get all active incidents (not CLOSED), sorted by priority then time.
 */
export async function getActiveIncidents(): Promise<WorkItem[]> {
  return WorkItem.findAll({
    where: {
      status: ["OPEN", "INVESTIGATING", "RESOLVED"],
    },
    order: [
      ["priority", "ASC"], // P0 first
      ["first_signal_at", "ASC"],
    ],
    include: [{ model: RCA, as: "rca", required: false }],
  });
}

export async function getIncidentById(id: string): Promise<WorkItem | null> {
  return WorkItem.findByPk(id, {
    include: [{ model: RCA, as: "rca", required: false }],
  });
}

export async function getAllIncidents(): Promise<WorkItem[]> {
  return WorkItem.findAll({
    order: [["created_at", "DESC"]],
    limit: 100,
    include: [{ model: RCA, as: "rca", required: false }],
  });
}

async function refreshIncidentCache(incident: WorkItem): Promise<void> {
  try {
    await cacheSet(`incident:${incident.id}`, incident.toJSON(), 300);
  } catch (err) {
    logger.warn("[CACHE] Failed to refresh incident cache", { error: (err as Error).message });
  }
}

export async function invalidateIncidentCache(incidentId: string): Promise<void> {
  try {
    await cacheDel(`incident:${incidentId}`);
  } catch { /* non-critical */ }
}
