import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import { DetailPanel } from '../components/DetailPanel.js';
import { FileTree } from '../components/FileTree.js';
import { GraphCanvas } from '../components/GraphCanvas.js';
import { Logo } from '../components/Logo.js';
import { ProgressHeader } from '../components/ProgressHeader.js';
import { useScanEvents } from '../hooks/useScanEvents.js';
import { api } from '../lib/api.js';
import { useUI } from '../stores/ui.js';

export function ScanView(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const scanId = id ?? '';
  const progress = useScanEvents(scanId);
  const { graphView } = useUI();

  const scan = useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => api.getScan(scanId),
    refetchInterval: (q) => {
      const data = q.state.data;
      return data?.stage === 'done' || data?.stage === 'failed' ? false : 2000;
    },
    enabled: Boolean(scanId),
  });

  const tree = useQuery({
    queryKey: ['tree', scanId],
    queryFn: () => api.getTree(scanId),
    enabled: scan.data?.stage === 'done',
  });

  const graph = useQuery({
    queryKey: ['graph', scanId, graphView],
    queryFn: () => api.getGraph(scanId, graphView),
    enabled: scan.data?.stage === 'done',
  });

  useEffect(() => {
    if (progress?.stage === 'done') {
      void scan.refetch();
    }
  }, [progress?.stage, scan]);

  return (
    <div className="flex h-screen flex-col bg-helix-bg">
      <header className="flex items-center justify-between border-b border-helix-border px-4 py-2">
        <Link to="/" className="flex items-center gap-2 text-helix-fg-muted hover:text-white">
          <Logo size={24} />
          <span className="font-semibold">Helix</span>
        </Link>
        <ProgressHeader scan={scan.data} progress={progress} />
      </header>

      <div className="grid flex-1 grid-cols-[260px_1fr_360px] overflow-hidden">
        <aside className="overflow-auto border-r border-helix-border bg-helix-bg-alt scrollbar-thin">
          <FileTree node={tree.data ?? null} />
        </aside>
        <main className="relative bg-helix-bg">
          <GraphCanvas graph={graph.data ?? null} />
        </main>
        <aside className="overflow-auto border-l border-helix-border bg-helix-bg-alt scrollbar-thin">
          <DetailPanel scanId={scanId} />
        </aside>
      </div>
    </div>
  );
}
