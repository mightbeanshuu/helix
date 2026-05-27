import { deriveModules, resolveImports } from '@helix/analyzer';
import { type ScanId, type ScanStage, newScanId as _ } from '@helix/shared';


import { type ProgressEmitter, progressForStage } from '../progress.js';

import { cloneRepo } from './clone.js';
import { detectRepo } from './detect.js';
import { parseFiles } from './parse.js';
import { buildGraph, persistGraph } from './persist.js';

import type { Env } from '../env.js';
import type { Logger } from '../logger.js';
import type { StorageAdapter } from '@helix/storage';

export interface RunArgs {
  scanId: ScanId;
  request: { url: string; branch?: string; token?: string; depth?: number };
  storage: StorageAdapter;
  progress: ProgressEmitter;
  logger: Logger;
  env: Env;
}

/**
 * The full scan pipeline. Each stage emits progress. On failure we mark the
 * scan failed but never crash the worker — the next job picks up.
 */
export async function runScan(args: RunArgs): Promise<void> {
  const { scanId, request, storage, progress, logger, env } = args;
  const stage = async (s: ScanStage, msg: string, ratio = 0) => {
    await progress.emit({ stage: s, percent: progressForStage(s, ratio), message: msg });
    await storage.setStage(scanId, s, progressForStage(s, ratio), msg);
  };

  try {
    await stage('cloning', `cloning ${request.url}`);
    const cloned = await cloneRepo({
      url: request.url,
      ...(request.branch && { branch: request.branch }),
      ...(request.token && { token: request.token }),
      ...(request.depth && { depth: request.depth }),
      cloneDir: env.HELIX_CLONE_DIR,
    });
    await storage.updateScan(scanId, { sha: cloned.sha });

    await stage('detecting', 'inspecting tree');
    const detect = await detectRepo(cloned.dir, env.HELIX_MAX_FILES);
    logger.info({ files: detect.files.length, stack: detect.stack }, 'detected');

    await stage('parsing', `parsing ${detect.files.length} files`);
    const parsed = await parseFiles(scanId, detect.files, {
      onProgress: (done, total) => {
        void progress.emit({
          stage: 'parsing',
          percent: progressForStage('parsing', done / total),
          message: `parsed ${done}/${total}`,
          filesProcessed: done,
          filesTotal: total,
        });
      },
    });

    await stage('analyzing', 'building graph');
    const graph = buildGraph(parsed);
    const resolved = resolveImports(
      graph.imports.map((i) => ({
        fileId: i.fromFileId as never,
        fromPath: i.fromPath,
        parsed: i.parsed,
      })),
      graph.files,
    );

    const modules = deriveModules(scanId, graph.files);
    await storage.upsertModules(scanId, modules);

    await stage('persisting', 'writing graph');
    await persistGraph(storage, scanId, graph, resolved);

    await stage('done', 'scan complete', 1);
    await storage.updateScan(scanId, {
      stage: 'done',
      percent: 100,
      finishedAt: new Date().toISOString(),
      stats: {
        files: graph.files.length,
        classes: graph.classes.length,
        functions: graph.functions.length,
        imports: resolved.length,
        commits: 0,
        authors: 0,
        languages: detect.languageCounts,
      },
    });
  } catch (err) {
    logger.error({ err }, 'scan failed');
    const message = err instanceof Error ? err.message : String(err);
    await progress.emit({ stage: 'failed', percent: 100, message });
    await storage.updateScan(scanId, {
      stage: 'failed',
      percent: 100,
      error: message,
      finishedAt: new Date().toISOString(),
    });
  }
}
