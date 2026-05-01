import { Request, Response, NextFunction } from "express";
import { Signal } from "../models/mongo/Signal";
import { WorkItem } from "../models/postgres";
import { sequelize } from "../models/postgres/db";
import { logger } from "../utils/logger";

/**
 * GET /metrics
 *
 * Provides aggregations for the dashboard.
 * - Signals per minute (from MongoDB)
 * - Incidents per severity (from PostgreSQL)
 */
export async function getMetricsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Signals per minute (last 10 minutes) - MongoDB Aggregation
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const signalsPerMinute = await Signal.aggregate([
      { $match: { timestamp: { $gte: tenMinutesAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d %H:%M", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 2. Incidents per severity - PostgreSQL Aggregation
    const incidentsPerSeverity = await WorkItem.findAll({
      attributes: [
        "priority",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["priority"],
      raw: true,
    });

    res.json({
      signalsPerMinute,
      incidentsPerSeverity,
    });
  } catch (err) {
    logger.error("[METRICS] Error fetching metrics", { error: (err as Error).message });
    next(err);
  }
}
