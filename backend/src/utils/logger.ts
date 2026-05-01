import winston from "winston";
import { config } from "../config";

// ─── Signal throughput counter ────────────────────────────────────────────────
let signalCount = 0;
let windowStart = Date.now();

export function incrementSignalCount(): void {
  signalCount++;
}

// Log signals/sec every 5 seconds (SRE observability requirement)
setInterval(() => {
  const now = Date.now();
  const elapsed = (now - windowStart) / 1000;
  const rate = signalCount / elapsed;
  logger.info(`[THROUGHPUT] Signals processed: ${signalCount} | Rate: ${rate.toFixed(2)} signals/sec`);
  signalCount = 0;
  windowStart = now;
}, config.metricsLogIntervalMs);

// ─── Logger ───────────────────────────────────────────────────────────────────
export const logger = winston.createLogger({
  level: config.nodeEnv === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
      return `[${timestamp}] ${level.toUpperCase().padEnd(5)} ${message}${metaStr}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});
