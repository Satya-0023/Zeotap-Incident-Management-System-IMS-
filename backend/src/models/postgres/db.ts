import { Sequelize } from "sequelize";
import { config } from "../../config";
import { logger } from "../../utils/logger";

export const sequelize = new Sequelize({
  dialect: "postgres",
  host: config.pg.host,
  port: config.pg.port,
  username: config.pg.username,
  password: config.pg.password,
  database: config.pg.database,
  logging: (msg) => logger.debug(`[PG] ${msg}`),
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true,
    timestamps: true,
  },
});

export async function connectPostgres(): Promise<void> {
  await sequelize.authenticate();
  logger.info("[POSTGRES] Connection established");
  await sequelize.sync({ alter: true });
  logger.info("[POSTGRES] Models synchronized");
}

export async function postgresHealth(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    return true;
  } catch {
    return false;
  }
}
