import { AlertStrategy } from "./AlertStrategy";
import { AlertPriority } from "../../models/postgres/WorkItem";

/** Default → P3 (any unrecognized component type) */
export class DefaultAlertStrategy implements AlertStrategy {
  readonly componentType = "DEFAULT";
  getPriority(): AlertPriority { return "P3"; }
  getDescription(): string { return "Unknown component — P3: Low priority, monitor and investigate"; }
}
