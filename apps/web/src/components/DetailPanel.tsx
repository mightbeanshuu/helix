import { useQuery } from '@tanstack/react-query';

import { api } from '../lib/api.js';
import { useUI } from '../stores/ui.js';

interface Props {
  scanId: string;
}

export function DetailPanel({ scanId }: Props): JSX.Element {
  const { selectedFileId } = useUI();

  const detail = useQuery({
    queryKey: ['file', scanId, selectedFileId],
    queryFn: () => api.getFile(scanId, selectedFileId!),
    enabled: Boolean(scanId && selectedFileId),
  });

  if (!selectedFileId) {
    return (
      <div className="p-4 text-sm text-helix-fg-muted">
        <p className="mb-2 font-medium text-helix-fg">Detail panel</p>
        <p>Select a file in the tree or graph to inspect it.</p>
      </div>
    );
  }

  if (detail.isLoading) {
    return <p className="p-4 text-sm text-helix-fg-muted">Loading…</p>;
  }

  if (!detail.data) {
    return <p className="p-4 text-sm text-helix-fg-muted">File not found.</p>;
  }

  const f = detail.data;
  return (
    <div className="p-4 text-sm">
      <h2 className="break-all font-mono text-helix-fg">{f.path}</h2>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label="LOC" value={f.loc} />
        <Stat label="Complexity" value={f.complexity} />
        <Stat label="Churn" value={f.churn} />
      </div>

      {f.summary && (
        <section className="mt-4">
          <h3 className="mb-1 text-xs uppercase tracking-wider text-helix-fg-muted">Summary</h3>
          <p className="leading-relaxed text-helix-fg">{f.summary}</p>
        </section>
      )}

      {f.imports.length > 0 && (
        <section className="mt-4">
          <h3 className="mb-1 text-xs uppercase tracking-wider text-helix-fg-muted">Imports</h3>
          <ul className="space-y-0.5 font-mono text-xs">
            {f.imports.slice(0, 30).map((imp) => (
              <li key={imp} className="truncate text-helix-fg-muted">
                {imp}
              </li>
            ))}
          </ul>
        </section>
      )}

      {f.classes.length > 0 && (
        <section className="mt-4">
          <h3 className="mb-1 text-xs uppercase tracking-wider text-helix-fg-muted">Classes</h3>
          <ul className="space-y-0.5 font-mono text-xs">
            {f.classes.map((c) => (
              <li key={c.id}>
                <span className="text-helix-accent-glow">{c.name}</span>{' '}
                <span className="text-helix-fg-muted">
                  L{c.lineStart}-{c.lineEnd}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {f.functions.length > 0 && (
        <section className="mt-4">
          <h3 className="mb-1 text-xs uppercase tracking-wider text-helix-fg-muted">
            Functions ({f.functions.length})
          </h3>
          <ul className="space-y-0.5 font-mono text-xs">
            {f.functions.slice(0, 50).map((fn) => (
              <li key={fn.id}>
                <span className="text-helix-fg">{fn.name}</span>{' '}
                <span className="text-helix-fg-muted">cc={fn.complexity}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <div className="rounded border border-helix-border bg-helix-panel py-2">
      <div className="text-helix-fg">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-helix-fg-muted">{label}</div>
    </div>
  );
}
