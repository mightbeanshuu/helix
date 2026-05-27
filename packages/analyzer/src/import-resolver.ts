import path from 'node:path';

import type { ParsedImport } from '@helix/parser';
import type { FileId, FileRecord, ImportRecord } from '@helix/shared';

const EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.java', '.go'];

/**
 * Resolves raw import specifiers to FileIds when possible. Relative paths get
 * resolved against the importing file; bare specifiers (e.g. `react`) are
 * left unresolved — they're third-party.
 *
 * This is intentionally heuristic: we don't run the real TS resolver. The
 * payoff/effort ratio for the graph view is much higher with this approach.
 */
export function resolveImports(
  imports: { fileId: FileId; fromPath: string; parsed: ParsedImport[] }[],
  files: FileRecord[],
): ImportRecord[] {
  const byPath = new Map<string, FileId>();
  for (const f of files) byPath.set(normalize(f.path), f.id);

  const out: ImportRecord[] = [];
  for (const { fileId, fromPath, parsed } of imports) {
    const fromDir = path.posix.dirname(normalize(fromPath));
    for (const imp of parsed) {
      if (!imp.isRelative) {
        out.push({ fromFileId: fileId, rawSpecifier: imp.specifier, resolved: false });
        continue;
      }
      const target = resolveRelative(fromDir, imp.specifier, byPath);
      if (target) {
        out.push({
          fromFileId: fileId,
          toFileId: target,
          rawSpecifier: imp.specifier,
          resolved: true,
        });
      } else {
        out.push({ fromFileId: fileId, rawSpecifier: imp.specifier, resolved: false });
      }
    }
  }
  return out;
}

function normalize(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.?\//, '');
}

function resolveRelative(
  fromDir: string,
  spec: string,
  byPath: Map<string, FileId>,
): FileId | undefined {
  const base = normalize(path.posix.join(fromDir, spec));
  if (byPath.has(base)) return byPath.get(base);
  for (const ext of EXTS) {
    if (byPath.has(base + ext)) return byPath.get(base + ext);
    if (byPath.has(`${base}/index${ext}`)) return byPath.get(`${base}/index${ext}`);
  }
  return undefined;
}
