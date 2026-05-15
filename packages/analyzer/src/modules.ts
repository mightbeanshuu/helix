import path from 'node:path';

import {
  type FileId,
  type FileRecord,
  type ModuleRecord,
  newModuleId,
  type ScanId,
  type SupportedLanguage,
} from '@helix/shared';

/**
 * "Module" here is the top-level directory the file lives in. For most repos
 * that's a useful first cut at the C4 "Component" level. We can refine to
 * a clustered version (Louvain on the import graph) in Phase 2.
 */
export function deriveModules(scanId: ScanId, files: FileRecord[]): ModuleRecord[] {
  const buckets = new Map<string, { files: FileId[]; languages: Set<string> }>();
  for (const f of files) {
    const parts = f.path.split('/').filter(Boolean);
    const top = parts.length > 1 ? parts[0] : '<root>';
    if (!top) continue;
    const bucket = buckets.get(top) ?? { files: [], languages: new Set() };
    bucket.files.push(f.id);
    bucket.languages.add(f.language);
    buckets.set(top, bucket);
  }
  const modules: ModuleRecord[] = [];
  for (const [name, bucket] of buckets.entries()) {
    const lang =
      bucket.languages.size === 1
        ? ((bucket.languages.values().next().value ?? 'mixed') as SupportedLanguage | 'mixed')
        : ('mixed' as const);
    modules.push({
      id: newModuleId(),
      scanId,
      path: name,
      name: path.basename(name),
      language: lang,
      fileIds: bucket.files,
    });
  }
  return modules;
}
