import { createStorage } from '@helix/storage';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';

import { loadEnv } from './env.js';
import { createLogger } from './logger.js';
import { runScan } from './pipeline/run.js';
import { RedisProgressEmitter } from './progress.js';

import type { ScanId } from '@helix/shared';

interface JobData {
  scanId: string;
  request: { url: string; branch?: string; token?: string; depth?: number };
}

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env);
  const storage = await createStorage(env);
  const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
  connection.on('error', (err) => logger.warn({ err: err.message }, 'redis error'));

  const worker = new Worker<JobData>(
    'scans',
    async (job) => {
      const childLogger = logger.child({ scanId: job.data.scanId });
      const emitter = new RedisProgressEmitter(connection, job.data.scanId as ScanId, childLogger);
      await runScan({
        scanId: job.data.scanId as ScanId,
        request: job.data.request,
        storage,
        progress: emitter,
        logger: childLogger,
        env,
      });
    },
    {
      connection,
      prefix: env.QUEUE_PREFIX,
      concurrency: env.QUEUE_CONCURRENCY,
    },
  );

  worker.on('ready', () => logger.info({ concurrency: env.QUEUE_CONCURRENCY }, 'worker ready'));
  worker.on('failed', (job, err) =>
    logger.error({ err: err.message, jobId: job?.id }, 'job failed'),
  );

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutting down worker');
    await worker.close();
    await storage.close();
    await connection.quit();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
   
  console.error('fatal:', err);
  process.exit(1);
});
