import { Request, Response, NextFunction } from "express";
import {
  getActiveIncidents,
  getAllIncidents,
  getIncidentById,
  transitionIncident,
} from "../services/incidentService";
import { submitRCA, getRCAByIncident } from "../services/rcaService";
import { Signal } from "../models/mongo/Signal";
import { IncidentStatus } from "../models/postgres/WorkItem";
import { z } from "zod";

// ─── GET /incidents ───────────────────────────────────────────────────────────
export async function listIncidentsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status } = req.query;
    const incidents = status === "all"
      ? await getAllIncidents()
      : await getActiveIncidents();
    res.json({ incidents, count: incidents.length });
  } catch (err) { next(err); }
}

// ─── GET /incidents/:id ───────────────────────────────────────────────────────
export async function getIncidentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const incident = await getIncidentById(req.params.id);
    if (!incident) {
      res.status(404).json({ error: "Incident not found" });
      return;
    }
    res.json({ incident });
  } catch (err) { next(err); }
}

// ─── GET /incidents/:id/signals ───────────────────────────────────────────────
export async function getIncidentSignalsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const signals = await Signal.find({ incidentId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();
    res.json({ signals, count: signals.length });
  } catch (err) { next(err); }
}

// ─── PATCH /incidents/:id/status ─────────────────────────────────────────────
const StatusSchema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]),
});

export async function updateStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = StatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid status", details: parsed.error.flatten() });
      return;
    }
    const incident = await transitionIncident(req.params.id, parsed.data.status as IncidentStatus);
    res.json({ incident });
  } catch (err) {
    const e = err as { status?: number; message: string };
    if (e.status === 400) {
      res.status(400).json({ error: e.message });
      return;
    }
    next(err);
  }
}

// ─── POST /incidents/:id/rca ──────────────────────────────────────────────────
const RCASchema = z.object({
  rootCauseCategory: z.string().min(1),
  startTime:         z.string().datetime({ offset: true }),
  endTime:           z.string().datetime({ offset: true }),
  fixDescription:    z.string().min(10),
  preventionSteps:   z.string().min(10),
});

export async function submitRCAHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = RCASchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid RCA data", details: parsed.error.flatten().fieldErrors });
      return;
    }
    const result = await submitRCA(req.params.id, parsed.data);
    res.status(201).json(result);
  } catch (err) {
    const e = err as { status?: number; message: string };
    if (e.status === 404 || e.status === 409) {
      res.status(e.status).json({ error: e.message });
      return;
    }
    next(err);
  }
}

// ─── GET /incidents/:id/rca ───────────────────────────────────────────────────
export async function getRCAHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rca = await getRCAByIncident(req.params.id);
    if (!rca) {
      res.status(404).json({ error: "No RCA found for this incident" });
      return;
    }
    res.json({ rca });
  } catch (err) { next(err); }
}
