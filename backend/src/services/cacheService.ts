import { cacheGet, cacheSet, cacheDel } from "../queues/redisStream";

export { cacheGet, cacheSet, cacheDel };

/**
 * Cache active incidents list for the dashboard.
 */
export async function cacheActiveIncidents(incidents: object[]): Promise<void> {
  await cacheSet("active_incidents", { incidents, cachedAt: new Date().toISOString() }, 30);
}

export async function getCachedActiveIncidents(): Promise<object[] | null> {
  const cached = await cacheGet<{ incidents: object[] }>("active_incidents");
  return cached?.incidents ?? null;
}
