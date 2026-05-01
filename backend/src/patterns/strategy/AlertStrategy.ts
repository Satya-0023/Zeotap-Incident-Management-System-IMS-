import { AlertPriority } from "../../models/postgres/WorkItem";

/**
 * Alert Strategy — Strategy Pattern
 *
 * Interface that all alerting strategies must implement.
 * Adding a new component type = adding a new class (Open/Closed principle).
 */
export interface AlertStrategy {
  readonly componentType: string;
  getPriority(): AlertPriority;
  getDescription(): string;
}
