import { AlertStrategy } from "./AlertStrategy";
import { AlertPriority } from "../../models/postgres/WorkItem";
import { RDBMSAlertStrategy } from "./RDBMSAlertStrategy";
import { CacheAlertStrategy } from "./CacheAlertStrategy";
import { DefaultAlertStrategy } from "./DefaultAlertStrategy";

/**
 * AlertContext — Strategy Pattern context class.
 *
 * Resolves the correct strategy based on component type.
 * To add a new component type: create a new strategy class and register it here.
 */
export class AlertContext {
  private static readonly strategies: Map<string, AlertStrategy> = new Map<string, AlertStrategy>([
    ["RDBMS",   new RDBMSAlertStrategy()],
    ["CACHE",   new CacheAlertStrategy()],
  ]);

  private static readonly defaultStrategy = new DefaultAlertStrategy();

  static getStrategy(componentType: string): AlertStrategy {
    return (
      AlertContext.strategies.get(componentType.toUpperCase()) ??
      AlertContext.defaultStrategy
    );
  }

  static getPriority(componentType: string): AlertPriority {
    return AlertContext.getStrategy(componentType).getPriority();
  }
}
