export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // Redis
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  streamName: process.env.STREAM_NAME || "signals_stream",
  consumerGroup: process.env.CONSUMER_GROUP || "ims_workers",
  consumerName: process.env.CONSUMER_NAME || "worker_1",
  workerBatchSize: parseInt(process.env.WORKER_BATCH_SIZE || "100", 10),

  // MongoDB
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/ims",

  // PostgreSQL
  pg: {
    host: process.env.PG_HOST || "localhost",
    port: parseInt(process.env.PG_PORT || "5432", 10),
    username: process.env.PG_USER || "ims_user",
    password: process.env.PG_PASSWORD || "ims_pass",
    database: process.env.PG_DB || "ims_db",
  },

  // Rate limiting
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "1000", 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "10000", 10),

  // Debouncing
  debounceTtlSeconds: parseInt(process.env.DEBOUNCE_TTL_SECONDS || "10", 10),

  // Retry
  retryMaxAttempts: 3,
  retryBaseDelayMs: 200,

  // Observability
  metricsLogIntervalMs: 5000,
};
