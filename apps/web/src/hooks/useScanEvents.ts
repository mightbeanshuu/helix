import { useEffect, useState } from 'react';

import { api } from '../lib/api.js';

import type { ScanProgress } from '@helix/shared';

/**
 * Subscribe to the SSE stream for a scan and surface the latest progress
 * message. Cleans up automatically when the scan reaches a terminal stage.
 */
export function useScanEvents(scanId: string | null | undefined): ScanProgress | null {
  const [progress, setProgress] = useState<ScanProgress | null>(null);

  useEffect(() => {
    if (!scanId) return;
    const source = api.events(scanId);
    const onMessage = (evt: MessageEvent<string>): void => {
      try {
        const data = JSON.parse(evt.data) as ScanProgress;
        setProgress(data);
        if (data.stage === 'done' || data.stage === 'failed') {
          source.close();
        }
      } catch {
        /* ignore malformed frames */
      }
    };
    source.addEventListener('message', onMessage);
    source.addEventListener('error', () => {
      // EventSource auto-reconnects; nothing for us to do unless we want to surface it.
    });
    return () => {
      source.removeEventListener('message', onMessage);
      source.close();
    };
  }, [scanId]);

  return progress;
}
