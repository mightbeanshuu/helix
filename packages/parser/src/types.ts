import type { SupportedLanguage } from '@helix/shared';

export interface ParsedSymbol {
  kind: 'class' | 'function' | 'method' | 'interface' | 'variable';
  name: string;
  fqn: string;
  lineStart: number;
  lineEnd: number;
  isExported: boolean;
  isAsync?: boolean;
  params?: string[];
  parentClass?: string;
  extends?: string;
  implements?: string[];
  complexity?: number;
}

export interface ParsedImport {
  specifier: string;
  /** symbol names imported (e.g. ['foo', 'bar']). Empty for side-effect imports. */
  names: string[];
  /** true if `import * as X from …` style */
  isNamespace: boolean;
  /** true if relative path (starts with `.` or `..`) */
  isRelative: boolean;
  line: number;
}

export interface ParsedCall {
  callerFqn: string;
  calleeName: string;
  calleeFqn?: string;
  line: number;
}

export interface FileMetrics {
  loc: number;
  blank: number;
  comment: number;
  complexity: number;
}

export interface ParseResult {
  language: SupportedLanguage;
  metrics: FileMetrics;
  imports: ParsedImport[];
  symbols: ParsedSymbol[];
  calls: ParsedCall[];
  exports: string[];
  errors: string[];
}

export interface LanguageBinding {
  language: SupportedLanguage;
  /** Native tree-sitter language object */
  grammar: unknown;
  /** Optional aliases — e.g. tsx parser handles both tsx and jsx */
  aliases?: SupportedLanguage[];
}
