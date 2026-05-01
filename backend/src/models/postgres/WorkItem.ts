import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./db";

export type IncidentStatus = "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
export type AlertPriority = "P0" | "P1" | "P2" | "P3";

/**
 * WorkItem — represents an incident / work item in PostgreSQL.
 *
 * Uses `version` column for optimistic locking to prevent race conditions
 * during concurrent state transitions.
 */
export class WorkItem extends Model<
  InferAttributes<WorkItem>,
  InferCreationAttributes<WorkItem>
> {
  declare id: CreationOptional<string>;
  declare componentId: string;
  declare componentType: string;
  declare status: IncidentStatus;
  declare priority: AlertPriority;
  declare firstSignalAt: Date;
  declare signalCount: CreationOptional<number>;
  declare mttrSeconds: CreationOptional<number | null>;
  declare version: CreationOptional<number>; // optimistic locking
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

WorkItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    componentId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "component_id",
    },
    componentType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "component_type",
    },
    status: {
      type: DataTypes.ENUM("OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"),
      allowNull: false,
      defaultValue: "OPEN",
    },
    priority: {
      type: DataTypes.ENUM("P0", "P1", "P2", "P3"),
      allowNull: false,
      defaultValue: "P3",
    },
    firstSignalAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "first_signal_at",
    },
    signalCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: "signal_count",
    },
    mttrSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: null,
      field: "mttr_seconds",
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "work_items",
    version: true, // Sequelize built-in optimistic locking
    indexes: [
      { fields: ["component_id"] },
      { fields: ["status"] },
      { fields: ["priority"] },
    ],
  }
);
