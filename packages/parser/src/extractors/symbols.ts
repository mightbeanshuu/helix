import type { ParsedCall, ParsedSymbol } from '../types.js';
import type { SupportedLanguage } from '@helix/shared';
import type { SyntaxNode } from 'tree-sitter';


export interface SymbolExtraction {
  symbols: ParsedSymbol[];
  calls: ParsedCall[];
  exports: string[];
}

const COMPLEXITY_NODE_TYPES = new Set([
  'if_statement',
  'else_clause',
  'else_if_clause',
  'elif_clause',
  'while_statement',
  'for_statement',
  'for_in_statement',
  'for_of_statement',
  'case_clause',
  'switch_case',
  'catch_clause',
  'except_clause',
  'conditional_expression',
  'ternary_expression',
  'logical_expression',
  'and_expression',
  'or_expression',
]);

function countComplexity(node: SyntaxNode): number {
  let c = 1;
  const stack: SyntaxNode[] = [node];
  while (stack.length) {
    const n = stack.pop();
    if (!n) continue;
    if (COMPLEXITY_NODE_TYPES.has(n.type)) c++;
    for (let i = n.childCount - 1; i >= 0; i--) {
      const child = n.child(i);
      if (child) stack.push(child);
    }
  }
  return c;
}

function getName(node: SyntaxNode): string {
  return (
    node.childForFieldName('name')?.text ??
    node.descendantsOfType('identifier')[0]?.text ??
    '<anon>'
  );
}

export function extractSymbols(root: SyntaxNode, language: SupportedLanguage): SymbolExtraction {
  const symbols: ParsedSymbol[] = [];
  const calls: ParsedCall[] = [];
  const exports: string[] = [];
  const ctx: { class?: string; func?: string }[] = [{}];

  const walker = (node: SyntaxNode): void => {
    const top = ctx[ctx.length - 1] ?? {};
    const t = node.type;

    let pushed = false;
    let exported = false;

    const parentClass = top.class;
    const parentFunc = top.func;

    if (
      t === 'class_declaration' ||
      t === 'class_definition' ||
      t === 'class' ||
      t === 'interface_declaration'
    ) {
      const name = getName(node);
      const fqn = parentClass ? `${parentClass}.${name}` : name;
      const extendsNode = node.childForFieldName('superclass') ?? node.descendantsOfType('superclasses')[0];
      const implementsNode = node.descendantsOfType('implements_clause')[0];
      symbols.push({
        kind: t === 'interface_declaration' ? 'interface' : 'class',
        name,
        fqn,
        lineStart: node.startPosition.row + 1,
        lineEnd: node.endPosition.row + 1,
        isExported: isExported(node, language),
        ...(extendsNode && { extends: extendsNode.text.replace(/^extends\s+/, '') }),
        ...(implementsNode && {
          implements: implementsNode
            .descendantsOfType('identifier')
            .map((n) => n.text)
            .filter(Boolean),
        }),
      });
      ctx.push({ ...top, class: fqn });
      pushed = true;
    } else if (
      t === 'function_declaration' ||
      t === 'function_definition' ||
      t === 'method_definition' ||
      t === 'method_declaration' ||
      t === 'arrow_function' ||
      t === 'function'
    ) {
      const name = getName(node);
      const fqn = parentClass
        ? `${parentClass}.${name}`
        : parentFunc
          ? `${parentFunc}.${name}`
          : name;
      const params = node.childForFieldName('parameters');
      const paramList = params
        ? params.namedChildren.map((c) => c.text).filter((s) => s.length > 0)
        : [];
      symbols.push({
        kind: parentClass ? 'method' : 'function',
        name,
        fqn,
        lineStart: node.startPosition.row + 1,
        lineEnd: node.endPosition.row + 1,
        isExported: isExported(node, language),
        params: paramList,
        complexity: countComplexity(node),
        ...(parentClass && { parentClass }),
      });
      ctx.push({ ...top, func: fqn });
      pushed = true;
    } else if (t === 'call_expression' || t === 'call' || t === 'method_invocation') {
      const callee =
        node.childForFieldName('function')?.text ??
        node.childForFieldName('name')?.text ??
        node.namedChildren[0]?.text ??
        '';
      if (callee && (parentFunc || parentClass)) {
        calls.push({
          callerFqn: parentFunc ?? parentClass ?? '<top>',
          calleeName: callee.split(/[.\s()]/)[0] ?? callee,
          line: node.startPosition.row + 1,
        });
      }
    } else if (
      t === 'export_statement' ||
      t === 'export_declaration' ||
      (t === 'identifier' && node.parent?.type === 'export_specifier')
    ) {
      exported = true;
    }

    if (exported) {
      const id = node.descendantsOfType('identifier')[0];
      if (id) exports.push(id.text);
    }

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) walker(child);
    }
    if (pushed) ctx.pop();
  };

  walker(root);

  return { symbols, calls, exports };
}

function isExported(node: SyntaxNode, language: SupportedLanguage): boolean {
  if (language === 'python') {
    const name = getName(node);
    return !name.startsWith('_');
  }
  if (language === 'java') {
    return /\bpublic\b/.test(node.text);
  }
  if (language === 'go') {
    const name = getName(node);
    return /^[A-Z]/.test(name);
  }
  // TS/JS: look at ancestor for `export` keyword
  let n: SyntaxNode | null = node.parent;
  while (n) {
    if (n.type === 'export_statement' || n.type === 'export_declaration') return true;
    n = n.parent;
  }
  return false;
}
