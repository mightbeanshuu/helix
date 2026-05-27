import type { ParsedImport } from '../types.js';
import type { SupportedLanguage } from '@helix/shared';
import type { SyntaxNode } from 'tree-sitter';


/**
 * Language-aware import extraction. We walk the tree-sitter parse tree and
 * collect raw specifiers + the symbol names they bind. This is good enough
 * for the dependency graph; full resolution happens in the analyzer.
 */
export function extractImports(root: SyntaxNode, language: SupportedLanguage): ParsedImport[] {
  switch (language) {
    case 'typescript':
    case 'tsx':
    case 'javascript':
    case 'jsx':
      return extractEcmaImports(root);
    case 'python':
      return extractPythonImports(root);
    case 'java':
      return extractJavaImports(root);
    case 'go':
      return extractGoImports(root);
    default:
      return [];
  }
}

const isRelative = (s: string): boolean => s.startsWith('.') || s.startsWith('/');

function* walk(node: SyntaxNode): Generator<SyntaxNode> {
  const stack: SyntaxNode[] = [node];
  while (stack.length) {
    const n = stack.pop();
    if (!n) continue;
    yield n;
    for (let i = n.childCount - 1; i >= 0; i--) {
      const child = n.child(i);
      if (child) stack.push(child);
    }
  }
}

const unquote = (s: string): string => s.replace(/^['"`](.*)['"`]$/, '$1');

function extractEcmaImports(root: SyntaxNode): ParsedImport[] {
  const out: ParsedImport[] = [];
  for (const node of walk(root)) {
    if (node.type !== 'import_statement') continue;
    const sourceNode = node.descendantsOfType('string')[0];
    if (!sourceNode) continue;
    const raw = unquote(sourceNode.text);
    const names: string[] = [];
    let isNamespace = false;

    const clause = node.childForFieldName('source')
      ? node.namedChildren.find((c) => c.type === 'import_clause')
      : undefined;
    const clauseNode = clause ?? node.namedChildren.find((c) => c.type === 'import_clause');
    if (clauseNode) {
      for (const child of clauseNode.namedChildren) {
        if (child.type === 'identifier') {
          names.push(child.text);
        } else if (child.type === 'namespace_import') {
          isNamespace = true;
          const id = child.descendantsOfType('identifier')[0];
          if (id) names.push(id.text);
        } else if (child.type === 'named_imports') {
          for (const spec of child.namedChildren) {
            if (spec.type === 'import_specifier') {
              const id = spec.descendantsOfType('identifier')[0];
              if (id) names.push(id.text);
            }
          }
        }
      }
    }

    out.push({
      specifier: raw,
      names,
      isNamespace,
      isRelative: isRelative(raw),
      line: node.startPosition.row + 1,
    });
  }
  return out;
}

function extractPythonImports(root: SyntaxNode): ParsedImport[] {
  const out: ParsedImport[] = [];
  for (const node of walk(root)) {
    if (node.type === 'import_statement') {
      for (const child of node.namedChildren) {
        if (child.type === 'dotted_name') {
          out.push({
            specifier: child.text,
            names: [child.text.split('.').pop() ?? child.text],
            isNamespace: false,
            isRelative: false,
            line: node.startPosition.row + 1,
          });
        }
      }
    } else if (node.type === 'import_from_statement') {
      const moduleNode = node.childForFieldName('module_name');
      if (!moduleNode) continue;
      const names: string[] = [];
      for (const child of node.namedChildren) {
        if (child.type === 'dotted_name' && child !== moduleNode) {
          names.push(child.text);
        } else if (child.type === 'aliased_import') {
          const id = child.descendantsOfType('identifier')[0];
          if (id) names.push(id.text);
        }
      }
      const spec = moduleNode.text;
      out.push({
        specifier: spec,
        names,
        isNamespace: false,
        isRelative: spec.startsWith('.'),
        line: node.startPosition.row + 1,
      });
    }
  }
  return out;
}

function extractJavaImports(root: SyntaxNode): ParsedImport[] {
  const out: ParsedImport[] = [];
  for (const node of walk(root)) {
    if (node.type !== 'import_declaration') continue;
    const path = node.namedChildren.map((c) => c.text).join('.');
    out.push({
      specifier: path,
      names: [path.split('.').pop() ?? path],
      isNamespace: path.endsWith('*'),
      isRelative: false,
      line: node.startPosition.row + 1,
    });
  }
  return out;
}

function extractGoImports(root: SyntaxNode): ParsedImport[] {
  const out: ParsedImport[] = [];
  for (const node of walk(root)) {
    if (node.type !== 'import_spec' && node.type !== 'import_declaration') continue;
    const stringNode = node.descendantsOfType('interpreted_string_literal')[0];
    if (!stringNode) continue;
    const raw = unquote(stringNode.text);
    out.push({
      specifier: raw,
      names: [raw.split('/').pop() ?? raw],
      isNamespace: false,
      isRelative: isRelative(raw),
      line: node.startPosition.row + 1,
    });
  }
  return out;
}
