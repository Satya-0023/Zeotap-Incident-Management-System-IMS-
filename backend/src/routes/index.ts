import { Router } from "express";
import { ingestSignalHandler } from "../controllers/signalController";
import {
  listIncidentsHandler,
  getIncidentHandler,
  getIncidentSignalsHandler,
  updateStatusHandler,
  submitRCAHandler,
  getRCAHandler,
} from "../controllers/incidentController";
import { getMetricsHandler } from "../controllers/metricController";
import { healthCheckHandler } from "../controllers/healthController";
import { rateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Ingestion API
router.post("/signals", rateLimiter, ingestSignalHandler);

// Incident Management
router.get("/incidents", listIncidentsHandler);
router.get("/incidents/:id", getIncidentHandler);
router.get("/incidents/:id/signals", getIncidentSignalsHandler);
router.patch("/incidents/:id/status", updateStatusHandler);

// RCA
router.post("/incidents/:id/rca", submitRCAHandler);
router.get("/incidents/:id/rca", getRCAHandler);

// Observability
router.get("/metrics", getMetricsHandler);
router.get("/health", healthCheckHandler);

export default router;
