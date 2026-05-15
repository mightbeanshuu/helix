# ADR-0001 — TypeScript end-to-end

**Status**: accepted
**Date**: 2026-05-16

## Context

We had two reasonable stacks:

- **Python backend + TS frontend**: tree-sitter has good Python bindings, FastAPI is excellent.
- **TypeScript everywhere**: single language, web-tree-sitter via WASM, isomorphic-git, no Python version drift.

## Decision

Use TypeScript end-to-end (Node 20+, strict mode).

## Why

- One language across packages → no marshaling overhead at the boundary.
- pnpm workspaces + TS project references give us excellent incremental build speeds.
- Worker-side code can run inside a Vite/Webpack dev tooling chain when we add a VS Code extension later.
- The macOS dev box this project was bootstrapped on shipped Python 3.9 only, which is below the floor most modern Python libs we'd want assume.

## Consequences

- We rely on `tree-sitter` Node bindings which compile native code. That means our worker Docker image is `bookworm` (not `alpine`) for now.
- We use `isomorphic-git` for git operations rather than shelling out — it's pure JS, slightly slower on huge histories but adequate.

## Revisit if

- A language-specific analysis (e.g. Python type inference via mypy) becomes a hard requirement.
- Worker memory pressure under huge repos becomes a problem in the JS runtime.
