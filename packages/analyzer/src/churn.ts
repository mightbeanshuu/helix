import fs from 'node:fs';
import path from 'node:path';

import * as git from 'isomorphic-git';

import type { CommitRecord } from '@helix/shared';

export interface FileChurn {
  path: string;
  commits: number;
  lastModified: string;
}

/**
 * Walks git history (via isomorphic-git so we have no native deps) and counts
 * commits per file. We cap at `since` to keep this fast on big repos.
 */
export async function computeChurn(
  repoDir: string,
  opts: { since?: Date; limit?: number } = {},
): Promise<{ churn: Map<string, FileChurn>; commits: Omit<CommitRecord, 'id' | 'scanId' | 'authorId'>[] }> {
  const churn = new Map<string, FileChurn>();
  const commits: Omit<CommitRecord, 'id' | 'scanId' | 'authorId'>[] = [];

  if (!fs.existsSync(path.join(repoDir, '.git'))) return { churn, commits };

  const log = await git.log({ fs, dir: repoDir, depth: opts.limit ?? 1000 });
  const sinceMs = opts.since?.getTime() ?? 0;

  // Walk commits oldest→newest so lastModified ends correct
  for (let i = log.length - 1; i >= 0; i--) {
    const entry = log[i];
    if (!entry) continue;
    const ts = entry.commit.author.timestamp * 1000;
    if (sinceMs && ts < sinceMs) continue;

    const sha = entry.oid;
    const parentSha = entry.commit.parent[0];
    const filesChanged = parentSha
      ? await diffFiles(repoDir, parentSha, sha)
      : await listTreeFiles(repoDir, sha);

    commits.push({
      sha,
      message: entry.commit.message.trim().split('\n')[0] ?? '',
      authoredAt: new Date(ts).toISOString(),
      files: filesChanged,
    });

    for (const file of filesChanged) {
      const existing = churn.get(file);
      if (existing) {
        existing.commits++;
        existing.lastModified = new Date(ts).toISOString();
      } else {
        churn.set(file, { path: file, commits: 1, lastModified: new Date(ts).toISOString() });
      }
    }
  }

  return { churn, commits };
}

async function diffFiles(dir: string, oldSha: string, newSha: string): Promise<string[]> {
  const result = new Set<string>();
  try {
    await git.walk({
      fs,
      dir,
      trees: [git.TREE({ ref: oldSha }), git.TREE({ ref: newSha })],
      map: async (filepath, [a, b]) => {
        if (filepath === '.') return;
        const aOid = a ? await a.oid() : null;
        const bOid = b ? await b.oid() : null;
        if (aOid !== bOid) result.add(filepath);
      },
    });
  } catch {
    /* swallow — some refs may not be reachable on shallow clones */
  }
  return Array.from(result);
}

async function listTreeFiles(dir: string, sha: string): Promise<string[]> {
  const result: string[] = [];
  try {
    await git.walk({
      fs,
      dir,
      trees: [git.TREE({ ref: sha })],
      map: async (filepath, [a]) => {
        if (!a || filepath === '.') return;
        const type = await a.type();
        if (type === 'blob') result.push(filepath);
      },
    });
  } catch {
    /* swallow */
  }
  return result;
}
