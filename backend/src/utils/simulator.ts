/**
 * Signal Simulator — generates burst traffic to test ingestion API
 *
 * Usage:
 *   npm run simulate
 *   SIGNALS=5000 CONCURRENCY=50 ts-node src/utils/simulator.ts
 */

import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:3001";
const TOTAL_SIGNALS = parseInt(process.env.SIGNALS || "1000", 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "20", 10);

const COMPONENT_TYPES = ["RDBMS", "CACHE", "API", "QUEUE", "STORAGE"] as const;
const COMPONENT_IDS = [
  "POSTGRES_PRIMARY_01",
  "CACHE_CLUSTER_01",
  "API_GATEWAY_01",
  "REDIS_QUEUE_01",
  "S3_BUCKET_01",
  "POSTGRES_REPLICA_01",
  "CACHE_CLUSTER_02",
];

const MESSAGES = [
  "Latency spike detected",
  "High CPU utilization",
  "Connection pool exhausted",
  "Disk I/O saturation",
  "Memory pressure critical",
  "Query timeout exceeded",
  "Replication lag detected",
];

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function sendSignal(): Promise<void> {
  const payload = {
    componentId: randomElement(COMPONENT_IDS),
    componentType: randomElement(COMPONENT_TYPES),
    timestamp: new Date().toISOString(),
    message: randomElement(MESSAGES),
  };

  await axios.post(`${API_URL}/signals`, payload, { timeout: 5000 });
}

async function runBatch(batchSize: number): Promise<void> {
  const promises = Array.from({ length: batchSize }, () =>
    sendSignal().catch(() => null) // Swallow individual failures
  );
  await Promise.all(promises);
}

async function main(): Promise<void> {
  console.log(`\n🚀 Signal Simulator Starting`);
  console.log(`   Target: ${API_URL}`);
  console.log(`   Total Signals: ${TOTAL_SIGNALS}`);
  console.log(`   Concurrency: ${CONCURRENCY}\n`);

  const start = Date.now();
  let sent = 0;

  while (sent < TOTAL_SIGNALS) {
    const batch = Math.min(CONCURRENCY, TOTAL_SIGNALS - sent);
    await runBatch(batch);
    sent += batch;
    const elapsed = (Date.now() - start) / 1000;
    const rate = sent / elapsed;
    process.stdout.write(`\r   Sent: ${sent}/${TOTAL_SIGNALS} | Rate: ${rate.toFixed(0)} signals/sec`);
  }

  const totalTime = (Date.now() - start) / 1000;
  console.log(`\n\n✅ Done! Sent ${TOTAL_SIGNALS} signals in ${totalTime.toFixed(2)}s`);
  console.log(`   Average rate: ${(TOTAL_SIGNALS / totalTime).toFixed(0)} signals/sec`);
}

main().catch(console.error);
