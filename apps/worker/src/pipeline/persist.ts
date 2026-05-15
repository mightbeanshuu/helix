import {
  type ClassRecord,
  type FileRecord,
  type FunctionRecord,
  type ImportRecord,
  type ScanId,
  newClassId,
  newFunctionId,
} from '@helix/shared';
import type { StorageAdapter } from '@helix/storage';

import type { ParsedFile } from './parse.js';

export interface BuiltGraph {
  files: FileRecord[];
  classes: ClassRecord[];
  functions: FunctionRecord[];
  imports: { fromFileId: string; fromPath: string; parsed: { specifier: string; names: string[]; isNamespace: boolean; isRelative: boolean; line: number }[] }[];
}

export function buildGraph(parsed: ParsedFile[]): BuiltGraph {
  const files: FileRecord[] = [];
  const classes: ClassRecord[] = [];
  const functions: FunctionRecord[] = [];
  const imports: BuiltGraph['imports'] = [];

  for (const p of parsed) {
    files.push(p.file);
    for (const s of p.parse.symbols) {
      if (s.kind === 'class' || s.kind === 'interface') {
        classes.push({
          id: newClassId(),
          fileId: p.file.id,
          name: s.name,
          fqn: s.fqn,
          lineStart: s.lineStart,
          lineEnd: s.lineEnd,
          ...(s.extends !== undefined && { extends: s.extends }),
          ...(s.implements !== undefined && { implements: s.implements }),
        });
      } else if (s.kind === 'function' || s.kind === 'method') {
        functions.push({
          id: newFunctionId(),
          fileId: p.file.id,
          name: s.name,
          fqn: s.fqn,
          lineStart: s.lineStart,
          lineEnd: s.lineEnd,
          complexity: s.complexity ?? 1,
          params: s.params ?? [],
          ...(s.isAsync !== undefined && { isAsync: s.isAsync }),
          isExported: s.isExported,
        });
      }
    }
    if (p.parse.imports.length) {
      imports.push({
        fromFileId: p.file.id,
        fromPath: p.file.path,
        parsed: p.parse.imports,
      });
    }
  }

  return { files, classes, functions, imports };
}

export async function persistGraph(
  storage: StorageAdapter,
  scanId: ScanId,
  graph: BuiltGraph,
  resolvedImports: ImportRecord[],
): Promise<void> {
  await storage.upsertFiles(scanId, graph.files);
  await storage.upsertClasses(scanId, graph.classes);
  await storage.upsertFunctions(scanId, graph.functions);
  await storage.upsertImports(scanId, resolvedImports);
}
