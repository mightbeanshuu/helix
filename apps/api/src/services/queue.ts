import type { CreateScanRequest } from '@helix/shared';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

import type { Env } from '../env.js';

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
  });
  // Surface connection errors but don't crash the process — workers may not
  // be up yet in dev.
  connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.warn('[queue] redis error:', err.message);
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
