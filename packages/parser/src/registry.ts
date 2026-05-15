import type { SupportedLanguage } from '@helix/shared';

import type { LanguageBinding } from './types.js';

/**
 * Lazy language registry. Grammars are required only when first needed —
 * this keeps cold start fast even though we ship many language bindings.
 *
 * Each loader is wrapped so failure to install a single grammar doesn't take
 * down the whole parser; we surface a clear "language not supported" error
 * to the caller instead.
 */
type Loader = () => Promise<LanguageBinding>;

const loaders: Partial<Record<SupportedLanguage, Loader>> = {
  typescript: async () => {
    const m = (await import('tree-sitter-typescript')) as { typescript: unknown };
    return { language: 'typescript', grammar: m.typescript };
  },
  tsx: async () => {
    const m = (await import('tree-sitter-typescript')) as { tsx: unknown };
    return { language: 'tsx', grammar: m.tsx };
  },
  javascript: async () => {
    const mod = await import('tree-sitter-javascript');
    return {
      language: 'javascript',
      grammar: (mod as { default?: unknown }).default ?? mod,
    };
  },
  jsx: async () => {
    const mod = await import('tree-sitter-javascript');
    return {
      language: 'jsx',
      grammar: (mod as { default?: unknown }).default ?? mod,
    };
  },
  python: async () => {
    const mod = await import('tree-sitter-python');
    return {
      language: 'python',
      grammar: (mod as { default?: unknown }).default ?? mod,
    };
  },
  java: async () => {
    const mod = await import('tree-sitter-java');
    return {
      language: 'java',
      grammar: (mod as { default?: unknown }).default ?? mod,
    };
  },
  go: async () => {
    const mod = await import('tree-sitter-go');
    return {
      language: 'go',
      grammar: (mod as { default?: unknown }).default ?? mod,
    };
  },
};

const cache = new Map<SupportedLanguage, LanguageBinding>();

export async function loadLanguage(language: SupportedLanguage): Promise<LanguageBinding | null> {
  const cached = cache.get(language);
  if (cached) return cached;
  const loader = loaders[language];
  if (!loader) return null;
  try {
    const binding = await loader();
    cache.set(language, binding);
    return binding;
  } catch (err) {
    // Grammar failed to load (likely not installed). Caller decides what to do.
    // eslint-disable-next-line no-console
    console.warn(`[parser] failed to load grammar for ${language}:`, err);
    return null;
  }
}

export function isLanguageSupported(language: SupportedLanguage): boolean {
  return loaders[language] !== undefined;
}
