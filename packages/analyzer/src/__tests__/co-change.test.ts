import type { FileId } from '@helix/shared';
import { describe, expect, it } from 'vitest';

import { computeCoChange } from '../co-change.js';

describe('computeCoChange', () => {
  it('emits an edge when files change together enough times', () => {
    const map = new Map<string, FileId>([
      ['a.ts', 'fil_a' as FileId],
      ['b.ts', 'fil_b' as FileId],
      ['c.ts', 'fil_c' as FileId],
    ]);
    const commits = Array.from({ length: 5 }, () => ({ files: ['a.ts', 'b.ts'] }));
    commits.push({ files: ['c.ts'] });
    const edges = computeCoChange(commits, map, { minWeight: 3 });
    expect(edges).toHaveLength(1);
    expect(edges[0]?.weight).toBe(5);
  });

  it('drops below-threshold pairs', () => {
    const map = new Map<string, FileId>([['a.ts', 'fil_a' as FileId], ['b.ts', 'fil_b' as FileId]]);
    const edges = computeCoChange([{ files: ['a.ts', 'b.ts'] }], map, { minWeight: 3 });
    expect(edges).toHaveLength(0);
  });
});
