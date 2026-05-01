import { AlertStrategy } from "./AlertStrategy";
import { AlertPriority } from "../../models/postgres/WorkItem";

/** RDBMS → P0 (highest priority — database failures are catastrophic) */
export class RDBMSAlertStrategy implements AlertStrategy {
  readonly componentType = "RDBMS";
  getPriority(): AlertPriority { return "P0"; }
  getDescription(): string { return "RDBMS failure — P0: Immediate escalation required"; }
}
