import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { sequelize } from "./db";

/**
 * RCA — Root Cause Analysis record (PostgreSQL).
 *
 * Required fields (all validated before incident can be CLOSED):
 * - rootCauseCategory
 * - startTime
 * - endTime
 * - fixDescription
 * - preventionSteps
 */
export class RCA extends Model<
  InferAttributes<RCA>,
  InferCreationAttributes<RCA>
> {
  declare id: CreationOptional<string>;
  declare workItemId: string;
  declare rootCauseCategory: string;
  declare startTime: Date;
  declare endTime: Date;
  declare fixDescription: string;
  declare preventionSteps: string;
  declare submittedAt: CreationOptional<Date>;
  declare mttrSeconds: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

RCA.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    workItemId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "work_item_id",
      references: { model: "work_items", key: "id" },
    },
    rootCauseCategory: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "root_cause_category",
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "start_time",
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "end_time",
    },
    fixDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "fix_description",
    },
    preventionSteps: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "prevention_steps",
    },
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "submitted_at",
    },
    mttrSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: null,
      field: "mttr_seconds",
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "rca_records",
    indexes: [{ fields: ["work_item_id"], unique: true }],
  }
);
