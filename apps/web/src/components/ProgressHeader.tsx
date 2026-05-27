import { cn } from '../lib/cn.js';

import type { ScanProgress, ScanStatus } from '@helix/shared';

interface Props {
  scan: ScanStatus | undefined;
  progress: ScanProgress | null;
}

export function ProgressHeader({ scan, progress }: Props): JSX.Element {
  const stage = progress?.stage ?? scan?.stage ?? 'queued';
  const percent = progress?.percent ?? scan?.percent ?? 0;
  const message = progress?.message ?? `Stage: ${stage}`;
  const isDone = stage === 'done';
  const isFailed = stage === 'failed';

  return (
    <div className="flex flex-1 items-center justify-end gap-4">
      <div className="hidden text-right text-xs text-helix-fg-muted sm:block">
        <div className="font-mono">{scan?.url ?? '—'}</div>
        <div>{message}</div>
      </div>
      <div className="relative h-1.5 w-64 overflow-hidden rounded-full bg-helix-panel">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
            isFailed
              ? 'bg-helix-danger'
              : isDone
                ? 'bg-helix-ok'
                : 'bg-helix-accent animate-pulse-slow',
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={cn('w-14 text-right text-xs font-mono', isFailed && 'text-helix-danger')}>
        {percent}%
      </span>
    </div>
  );
}
