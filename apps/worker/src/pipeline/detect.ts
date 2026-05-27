import fs from 'node:fs/promises';
import path from 'node:path';

import { IGNORED_DIRS, IGNORED_FILE_PATTERNS, LANGUAGE_BY_EXT, type SupportedLanguage } from '@helix/shared';

import type { Dirent } from 'node:fs';

export interface FileInventory {
  /** path relative to repo dir */
  relPath: string;
  /** absolute path */
  absPath: string;
  language: SupportedLanguage | 'unknown';
  bytes: number;
}

export interface DetectResult {
  files: FileInventory[];
  languageCounts: Record<string, number>;
  stack: string[];
}

/**
 * Walks the repo, classifies files, and infers a rough "stack" (which
 * frameworks / package managers it uses) by looking for sentinel files.
 */
export async function detectRepo(dir: string, maxFiles: number): Promise<DetectResult> {
  const files: FileInventory[] = [];
  const languageCounts: Record<string, number> = {};
  let count = 0;

  async function walk(current: string): Promise<void> {
    if (count >= maxFiles) return;
    let entries: Dirent[];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (count >= maxFiles) return;
      if (entry.isSymbolicLink()) continue;
      if (IGNORED_DIRS.has(entry.name)) continue;
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(abs);
      } else if (entry.isFile()) {
        if (IGNORED_FILE_PATTERNS.some((re) => re.test(entry.name))) continue;
        const ext = path.extname(entry.name).toLowerCase();
        const language: SupportedLanguage | 'unknown' = LANGUAGE_BY_EXT[ext] ?? 'unknown';
        let bytes = 0;
        try {
          bytes = (await fs.stat(abs)).size;
        } catch {
          continue;
        }
        if (bytes > 2 * 1024 * 1024) continue; // skip files >2MB
        const relPath = path.relative(dir, abs).replace(/\\/g, '/');
        files.push({ relPath, absPath: abs, language, bytes });
        languageCounts[language] = (languageCounts[language] ?? 0) + 1;
        count++;
      }
    }
  }
  await walk(dir);

  const stack = await inferStack(dir);
  return { files, languageCounts, stack };
}

async function inferStack(dir: string): Promise<string[]> {
  const out: string[] = [];
  const probes: [string, string][] = [
    ['package.json', 'node'],
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['requirements.txt', 'pip'],
    ['poetry.lock', 'poetry'],
    ['pyproject.toml', 'python'],
    ['go.mod', 'go'],
    ['Cargo.toml', 'rust'],
    ['pom.xml', 'maven'],
    ['build.gradle', 'gradle'],
    ['build.gradle.kts', 'gradle-kts'],
    ['Gemfile', 'ruby'],
    ['Dockerfile', 'docker'],
    ['docker-compose.yml', 'docker-compose'],
    ['next.config.js', 'next'],
    ['next.config.mjs', 'next'],
    ['nuxt.config.ts', 'nuxt'],
    ['vite.config.ts', 'vite'],
    ['svelte.config.js', 'svelte'],
    ['astro.config.mjs', 'astro'],
    ['manage.py', 'django'],
    ['app.py', 'flask'],
    ['main.go', 'go-bin'],
  ];
  for (const [file, tag] of probes) {
    try {
      await fs.access(path.join(dir, file));
      out.push(tag);
    } catch {
      /* not present */
    }
  }
  return out;
}
