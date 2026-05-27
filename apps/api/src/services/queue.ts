import { Queue } from 'bullmq';
import IORedis from 'ioredis';

import type { Env } from '../env.js';
import type { CreateScanRequest } from '@helix/shared';

export interface ScanJobData {
  scanId: string;
  request: CreateScanRequest;
}

let queue: Queue<ScanJobData> | null = null;
let connection: IORedis | null = null;

export function createQueue(env: Env): Queue<ScanJobData> {
  if (queue) return queue;
  connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => Math.min(30_000, 1000 + times * 1000),
    reconnectOnError: () => false,
  });
  // Surface the first error per process so dev knows Redis is missing, but
  // suppress the firehose of reconnect attempts.
  let warned = false;
  connection.on('error', (err) => {
    if (warned) return;
    warned = true;

    console.warn(
      `[queue] redis unavailable (${err.message}). Queue calls will fail until Redis is up.`,
    );
  });
  queue = new Queue<ScanJobData>('scans', {
    connection,
    prefix: env.QUEUE_PREFIX,
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: { age: 86400, count: 1000 },
      removeOnFail: { age: 86400 * 7 },
    },
  });
  return queue;
}

export async function closeQueue(): Promise<void> {
  await queue?.close();
  await connection?.quit();
  queue = null;
  connection = null;
}
