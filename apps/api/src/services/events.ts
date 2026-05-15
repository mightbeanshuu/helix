import { EventEmitter } from 'node:events';

import type { ScanProgress } from '@helix/shared';

/**
 * In-process event bus for scan progress. Workers publish via Redis pub/sub
 * (Phase 1b) and the API translates those into SSE; in dev with no Redis we
 * just emit directly on this bus.
 */
class EventBus extends EventEmitter {
  publishProgress(progress: ScanProgress): void {
    this.emit(`scan:${progress.scanId}`, progress);
    this.emit('scan:any', progress);
  }

  subscribe(scanId: string, listener: (p: ScanProgress) => void): () => void {
    const channel = `scan:${scanId}`;
    this.on(channel, listener);
    return () => this.off(channel, listener);
  }
}

export const eventBus = new EventBus();
eventBus.setMaxListeners(1024);
