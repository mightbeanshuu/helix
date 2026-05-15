export const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'python',
  'java',
  'go',
  'rust',
  'c',
  'cpp',
  'ruby',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_BY_EXT: Record<string, SupportedLanguage> = {
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.js': 'javascript',
  '.jsx': 'jsx',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.pyi': 'python',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.c': 'c',
  '.h': 'c',
  '.cc': 'cpp',
  '.cpp': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.rb': 'ruby',
};

export const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.cache',
  'target',
  'vendor',
  '__pycache__',
  '.venv',
  'venv',
  '.tox',
  '.idea',
  '.vscode',
  'coverage',
  '.turbo',
  '.pnpm-store',
]);

export const IGNORED_FILE_PATTERNS = [
  /\.min\.(js|css)$/i,
  /\.lock$/i,
  /^pnpm-lock\.yaml$/i,
  /^package-lock\.json$/i,
  /^yarn\.lock$/i,
  /^Cargo\.lock$/i,
  /^poetry\.lock$/i,
  /\.(png|jpg|jpeg|gif|webp|ico|svg|woff2?|ttf|otf|eot|pdf|zip|tar|gz|exe|bin)$/i,
];

export const SCAN_STAGES = [
  'queued',
  'cloning',
  'detecting',
  'parsing',
  'analyzing',
  'embedding',
  'summarizing',
  'persisting',
  'done',
  'failed',
] as const;

export type ScanStage = (typeof SCAN_STAGES)[number];

export const DEFAULT_BUDGET_USD = 5.0;
export const DEFAULT_EMBED_BATCH = 64;
export const DEFAULT_MAX_FILES = 50_000;
export const DEFAULT_MAX_REPO_MB = 512;
