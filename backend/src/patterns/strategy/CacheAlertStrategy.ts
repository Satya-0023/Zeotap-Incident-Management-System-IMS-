import { AlertStrategy } from "./AlertStrategy";
import { AlertPriority } from "../../models/postgres/WorkItem";

/** CACHE → P2 (cache degradation is serious but not immediately catastrophic) */
export class CacheAlertStrategy implements AlertStrategy {
  readonly componentType = "CACHE";
  getPriority(): AlertPriority { return "P2"; }
  getDescription(): string { return "Cache failure — P2: High priority, investigate promptly"; }
}
