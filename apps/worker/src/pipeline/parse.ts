import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';

import { type FileId, type FileRecord, type ScanId, newFileId } from '@helix/shared';
import { parseFile, type ParseResult } from '@helix/parser';

import type { FileInventory } from './detect.js';

export interface ParsedFile {
  file: FileRecord;
  parse: ParseResult;
  inventory: FileInventory;
}

/**
 * Parses files in chunks to avoid memory spikes on huge repos. Skips files
 * whose language we don't support (they still get a FileRecord, just no AST).
 */
export async function parseFiles(
  scanId: ScanId,
  inventory: FileInventory[],
  opts: { onProgress?: (done: number, total: number) => void } = {},
): Promise<ParsedFile[]> {
  const out: ParsedFile[] = [];
  const total = inventory.length;
  const chunkSize = 32;

  for (let i = 0; i < inventory.length; i += chunkSize) {
    const chunk = inventory.slice(i, i + chunkSize);
    const results = await Promise.all(chunk.map((inv) => parseOne(scanId, inv)));
    for (const r of results) if (r) out.push(r);
    opts.onProgress?.(Math.min(i + chunkSize, total), total);
  }
  return out;
}

async function parseOne(scanId: ScanId, inv: FileInventory): Promise<ParsedFile | null> {
  let source: string;
  try {
    source = await fs.readFile(inv.absPath, 'utf8');
  } catch {
    return null;
  }
  const contentHash = createHash('sha256').update(source).digest('hex');
  const fileId: FileId = newFileId();

  if (inv.language === 'unknown') {
    const file: FileRecord = {
      id: fileId,
      scanId,
      path: inv.relPath,
      language: 'unknown',
      loc: source.split(/\r?\n/).length,
      complexity: 0,
      churn: 0,
      contentHash,
    };
    return {
      file,
      parse: {
        language: 'typescript',
        metrics: { loc: file.loc, blank: 0, comment: 0, complexity: 0 },
        imports: [],
        symbols: [],
        calls: [],
        exports: [],
        errors: [],
      },
      inventory: inv,
    };
  }

  const parse = await parseFile(source, inv.language);
  const file: FileRecord = {
    id: fileId,
    scanId,
    path: inv.relPath,
    language: inv.language,
    loc: parse.metrics.loc,
    complexity: parse.metrics.complexity,
    churn: 0,
    contentHash,
  };
  return { file, parse, inventory: inv };
}
