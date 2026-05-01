import { Request, Response } from "express";
import mongoose from "mongoose";
import { redisHealth } from "../queues/redisStream";
import { postgresHealth } from "../models/postgres/db";

/**
 * GET /health
 * 
 * Checks connectivity to all critical dependencies.
 * Essential for SRE observability.
 */
export async function healthCheckHandler(req: Request, res: Response): Promise<void> {
  const mongoStatus = mongoose.connection.readyState === 1;
  const redisStatus = await redisHealth();
  const postgresStatus = await postgresHealth();

  const isHealthy = mongoStatus && redisStatus && postgresStatus;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoStatus ? "connected" : "disconnected",
      redis: redisStatus ? "connected" : "disconnected",
      postgresql: postgresStatus ? "connected" : "disconnected",
    },
  });
}
