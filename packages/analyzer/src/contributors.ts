import fs from 'node:fs';

import { type AuthorRecord, newAuthorId } from '@helix/shared';
import * as git from 'isomorphic-git';

export interface ContributorMap {
  authors: AuthorRecord[];
  /** sha → authorId */
  shaToAuthor: Map<string, string>;
  /** path → top contributor */
  ownership: Map<string, string>;
}

export async function computeContributors(
  repoDir: string,
  opts: { limit?: number } = {},
): Promise<ContributorMap> {
  const authorsByKey = new Map<string, AuthorRecord>();
  const shaToAuthor = new Map<string, string>();
  const pathCommits = new Map<string, Map<string, number>>();

  const log = await git.log({ fs, dir: repoDir, depth: opts.limit ?? 1000 });
  for (const entry of log) {
    const { name, email } = entry.commit.author;
    const key = `${name.toLowerCase()}|${(email ?? '').toLowerCase()}`;
    let author = authorsByKey.get(key);
    if (!author) {
      author = { id: newAuthorId(), name, ...(email !== undefined && { email }), commits: 0 };
      authorsByKey.set(key, author);
    }
    author.commits++;
    shaToAuthor.set(entry.oid, author.id);
  }

  // Ownership: top author per file (approximate — uses last 1000 commits)
  const ownership = new Map<string, string>();
  for (const [filePath, perAuthor] of pathCommits.entries()) {
    let top: { authorId: string; commits: number } | null = null;
    for (const [authorId, commits] of perAuthor.entries()) {
      if (!top || commits > top.commits) top = { authorId, commits };
    }
    if (top) ownership.set(filePath, top.authorId);
  }

  return { authors: Array.from(authorsByKey.values()), shaToAuthor, ownership };
}
