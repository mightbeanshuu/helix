import { createHash } from 'node:crypto';
import nodefs from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { CloneError, ValidationError } from '@helix/shared';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';

export interface CloneArgs {
  url: string;
  branch?: string;
  token?: string;
  depth?: number;
  cloneDir: string;
}

export interface CloneResult {
  dir: string;
  sha: string;
  branch: string;
}

const ALLOWED_SCHEMES = /^(https?|file|git\+https?):/i;

export async function cloneRepo(args: CloneArgs): Promise<CloneResult> {
  const isLocalPath = args.url.startsWith('/');
  if (!isLocalPath && !ALLOWED_SCHEMES.test(args.url) && !args.url.startsWith('git@')) {
    throw new ValidationError(`Disallowed URL scheme: ${args.url}`);
  }

  // If a local absolute path is passed, just register it. No clone needed.
  if (isLocalPath) {
    const stat = await fs.stat(args.url).catch(() => null);
    if (!stat?.isDirectory()) throw new ValidationError('Local path is not a directory');
    const sha = await safeGitSha(args.url);
    return { dir: args.url, sha, branch: args.branch ?? 'HEAD' };
  }

  const hash = createHash('sha256').update(args.url).digest('hex').slice(0, 16);
  const targetDir = path.join(args.cloneDir, hash);
  await fs.mkdir(targetDir, { recursive: true });

  try {
    await git.clone({
      fs: nodefs,
      http,
      dir: targetDir,
      url: args.url,
      ...(args.branch && { ref: args.branch }),
      singleBranch: true,
      depth: args.depth ?? 100,
      ...(args.token && {
        onAuth: () => ({ username: args.token!, password: 'x-oauth-basic' }),
      }),
    });
  } catch (err) {
    throw new CloneError(args.url, err);
  }

  const sha = await safeGitSha(targetDir);
  return { dir: targetDir, sha, branch: args.branch ?? 'HEAD' };
}

async function safeGitSha(dir: string): Promise<string> {
  try {
    return await git.resolveRef({ fs: nodefs, dir, ref: 'HEAD' });
  } catch {
    return '0000000000000000000000000000000000000000';
  }
}
