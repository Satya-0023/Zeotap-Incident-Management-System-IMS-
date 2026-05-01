import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { config } from "./config";
import { logger } from "./utils/logger";
import { connectPostgres } from "./models/postgres/db";
import { startWorker } from "./workers/signalWorker";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use("/", routes);

// Error Handling
app.use(errorHandler);

async function bootstrap() {
  try {
    // 1. Connect MongoDB
    await mongoose.connect(config.mongoUri);
    logger.info("[MONGODB] Connected");

    // 2. Connect PostgreSQL
    await connectPostgres();

    // 3. Start Background Worker
    // Note: In a production environment, you might run the worker in a separate process/container.
    // Here we run it alongside the API for simplicity in a single-container docker-compose setup.
    startWorker().catch((err) => {
      logger.error("[WORKER] Failed to start", { error: err.message });
    });

    // 4. Start Server
    app.listen(config.port, () => {
      logger.info(`[SERVER] API listening on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (err) {
    logger.error("[BOOTSTRAP] Initialization failed", { error: (err as Error).message });
    process.exit(1);
  }
}

bootstrap();
