import { useState } from 'react';

import { cn } from '../lib/cn.js';
import { useUI } from '../stores/ui.js';

import type { FileTreeNodeShape } from '@helix/shared';

interface Props {
  node: FileTreeNodeShape | null;
}

export function FileTree({ node }: Props): JSX.Element {
  if (!node) {
    return <p className="p-4 text-sm text-helix-fg-muted">Waiting for scan to finish…</p>;
  }
  return (
    <div className="p-2 font-mono text-xs">
      <TreeNode node={node} depth={0} />
    </div>
  );
}

function TreeNode({ node, depth }: { node: FileTreeNodeShape; depth: number }): JSX.Element {
  const isDir = node.type === 'dir';
  const [open, setOpen] = useState(depth < 2);
  const { selectedFileId, setSelectedFileId } = useUI();
  const selected = !isDir && selectedFileId === node.id;

  return (
    <div>
      <button
        type="button"
        onClick={() => (isDir ? setOpen((o) => !o) : setSelectedFileId(node.id))}
        className={cn(
          'flex w-full items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-helix-panel',
          selected && 'bg-helix-accent/20 text-white',
        )}
        style={{ paddingLeft: depth * 12 + 4 }}
      >
        <span className="w-3 text-helix-fg-muted">{isDir ? (open ? '▾' : '▸') : ' '}</span>
        <span className={cn(isDir ? 'text-helix-fg' : 'text-helix-fg-muted')}>{node.name}</span>
        {!isDir && node.loc !== undefined && (
          <span className="ml-auto text-[10px] text-helix-fg-muted">{node.loc}</span>
        )}
      </button>
      {isDir && open && node.children?.length ? (
        <div>
          {node.children.map((c) => (
            <TreeNode key={c.id} node={c} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
