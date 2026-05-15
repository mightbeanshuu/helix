import type { CoChangeEdge, FileId } from '@helix/shared';

/**
 * Files that change together get an edge weighted by how many commits touched
 * them simultaneously. We use a min-weight threshold to drop noise and keep
 * top-K per node to avoid an O(N²) graph.
 */
export function computeCoChange(
  commits: { files: string[] }[],
  pathToFileId: Map<string, FileId>,
  opts: { minWeight?: number; topK?: number } = {},
): CoChangeEdge[] {
  const minWeight = opts.minWeight ?? 3;
  const topK = opts.topK ?? 8;
  const pairs = new Map<string, number>();

  for (const c of commits) {
    const ids = c.files
      .map((p) => pathToFileId.get(p))
      .filter((x): x is FileId => x !== undefined);
    if (ids.length < 2 || ids.length > 50) continue; // skip mega-commits
    ids.sort();
    for (let i = 0; i < ids.length; i++) {
      const a = ids[i];
      if (!a) continue;
      for (let j = i + 1; j < ids.length; j++) {
        const b = ids[j];
        if (!b) continue;
        const key = `${a}|${b}`;
        pairs.set(key, (pairs.get(key) ?? 0) + 1);
      }
    }
  }

  const byFile = new Map<string, { peer: FileId; weight: number }[]>();
  for (const [key, weight] of pairs.entries()) {
    if (weight < minWeight) continue;
    const [a, b] = key.split('|') as [FileId, FileId];
    for (const [src, dst] of [
      [a, b],
      [b, a],
    ] as const) {
      const list = byFile.get(src) ?? [];
      list.push({ peer: dst, weight });
      byFile.set(src, list);
    }
  }

  const edges: CoChangeEdge[] = [];
  const seen = new Set<string>();
  for (const [file, peers] of byFile.entries()) {
    peers.sort((x, y) => y.weight - x.weight);
    for (const { peer, weight } of peers.slice(0, topK)) {
      const key = file < peer ? `${file}|${peer}` : `${peer}|${file}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ fileA: file as FileId, fileB: peer, weight });
    }
  }
  return edges;
}
