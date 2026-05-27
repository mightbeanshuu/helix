import type { FileMetrics } from './types.js';
import type { SupportedLanguage } from '@helix/shared';


const SINGLE_LINE_COMMENT: Partial<Record<SupportedLanguage, RegExp>> = {
  typescript: /^\s*\/\//,
  tsx: /^\s*\/\//,
  javascript: /^\s*\/\//,
  jsx: /^\s*\/\//,
  java: /^\s*\/\//,
  go: /^\s*\/\//,
  rust: /^\s*\/\//,
  c: /^\s*\/\//,
  cpp: /^\s*\/\//,
  python: /^\s*#/,
  ruby: /^\s*#/,
};

const COMPLEXITY_KEYWORDS: Partial<Record<SupportedLanguage, RegExp>> = {
  typescript: /\b(if|else if|for|while|case|catch|&&|\|\||\?)\b/g,
  tsx: /\b(if|else if|for|while|case|catch|&&|\|\||\?)\b/g,
  javascript: /\b(if|else if|for|while|case|catch|&&|\|\||\?)\b/g,
  jsx: /\b(if|else if|for|while|case|catch|&&|\|\||\?)\b/g,
  python: /\b(if|elif|for|while|except|and|or)\b/g,
  java: /\b(if|else if|for|while|case|catch|&&|\|\||\?)\b/g,
  go: /\b(if|else if|for|case|&&|\|\|)\b/g,
  rust: /\b(if|else if|for|while|match|&&|\|\||\?)\b/g,
  c: /\b(if|else if|for|while|case|&&|\|\||\?)\b/g,
  cpp: /\b(if|else if|for|while|case|catch|&&|\|\||\?)\b/g,
  ruby: /\b(if|elsif|for|while|case|rescue|&&|\|\|)\b/g,
};

/**
 * Cheap-and-cheerful metrics. The numbers don't need to match SonarQube — they
 * need to be comparable across files in the same repo to drive heatmaps.
 *
 * For real cyclomatic complexity we'll walk the AST per-function in
 * extractors/symbols.ts (Phase 2). This is a file-level shortcut for now.
 */
export function computeMetrics(source: string, language: SupportedLanguage): FileMetrics {
  const lines = source.split(/\r?\n/);
  let blank = 0;
  let comment = 0;
  const commentRe = SINGLE_LINE_COMMENT[language];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      blank++;
    } else if (commentRe?.test(line)) {
      comment++;
    }
  }
  const loc = lines.length - blank - comment;
  const complexityRe = COMPLEXITY_KEYWORDS[language];
  const matches = complexityRe ? source.match(complexityRe) : null;
  const complexity = 1 + (matches?.length ?? 0);
  return { loc: Math.max(0, loc), blank, comment, complexity };
}
