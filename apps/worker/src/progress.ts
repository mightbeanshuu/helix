import type { Logger } from './logger.js';
import type { ScanId, ScanProgress, ScanStage } from '@helix/shared';
import type Redis from 'ioredis';


export interface ProgressEmitter {
  emit(p: Omit<ScanProgress, 'scanId' | 'at'>): Promise<void>;
}

/**
 * Publishes progress to Redis pub/sub channel that the API subscribes to.
 * The API mirrors the message onto its in-process EventBus for SSE clients.
 */
export class RedisProgressEmitter implements ProgressEmitter {
  constructor(
    private readonly redis: Redis,
    private readonly scanId: ScanId,
    private readonly logger: Logger,
  ) {}

  async emit(p: Omit<ScanProgress, 'scanId' | 'at'>): Promise<void> {
    const payload: ScanProgress = {
      ...p,
      scanId: this.scanId,
      at: new Date().toISOString(),
    };
    this.logger.debug({ stage: p.stage, percent: p.percent }, 'progress');
    try {
      await this.redis.publish(`helix:scan:${this.scanId}`, JSON.stringify(payload));
    } catch (err) {
      this.logger.warn({ err }, 'failed to publish progress');
    }
  }
}

export const STAGE_WEIGHTS: Record<ScanStage, [number, number]> = {
  queued: [0, 1],
  cloning: [1, 10],
  detecting: [10, 12],
  parsing: [12, 55],
  analyzing: [55, 75],
  embedding: [75, 88],
  summarizing: [88, 97],
  persisting: [97, 99],
  done: [99, 100],
  failed: [100, 100],
};

export function progressForStage(stage: ScanStage, ratio = 0): number {
  const [start, end] = STAGE_WEIGHTS[stage];
  return Math.round(start + Math.max(0, Math.min(1, ratio)) * (end - start));
}
