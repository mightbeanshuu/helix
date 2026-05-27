import TreeSitter from 'tree-sitter';

import { extractImports } from './extractors/imports.js';
import { extractSymbols } from './extractors/symbols.js';
import { computeMetrics } from './metrics.js';
import { loadLanguage } from './registry.js';

import type { ParseResult } from './types.js';
import type { SupportedLanguage } from '@helix/shared';

/**
 * Stateless façade. Tree-sitter parsers are cheap to create but reusing one
 * per language saves a few ms per file at scale; we keep a tiny pool keyed
 * by language.
 */
const parserPool = new Map<SupportedLanguage, TreeSitter>();

async function getParser(language: SupportedLanguage): Promise<TreeSitter | null> {
  const cached = parserPool.get(language);
  if (cached) return cached;
  const binding = await loadLanguage(language);
  if (!binding) return null;
  const parser = new TreeSitter();
  parser.setLanguage(binding.grammar);
  parserPool.set(language, parser);
  return parser;
}

export async function parseFile(source: string, language: SupportedLanguage): Promise<ParseResult> {
  const result: ParseResult = {
    language,
    metrics: computeMetrics(source, language),
    imports: [],
    symbols: [],
    calls: [],
    exports: [],
    errors: [],
  };

  const parser = await getParser(language);
  if (!parser) {
    result.errors.push(`unsupported language: ${language}`);
    return result;
  }

  try {
    const tree = parser.parse(source);
    if (!tree?.rootNode) return result;
    result.imports = extractImports(tree.rootNode, language);
    const { symbols, calls, exports } = extractSymbols(tree.rootNode, language);
    result.symbols = symbols;
    result.calls = calls;
    result.exports = exports;
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : String(err));
  }

  return result;
}
