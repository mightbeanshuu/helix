# Contributing to Helix

Thanks for being here. Helix is early — every contribution shapes the foundation.

## Ground rules

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `perf:`, `build:`, `ci:`.
- **One PR, one concern.** Refactors and features don't ride together.
- **Tests first.** New behavior gets a unit test; new endpoints get an integration test.
- **TypeScript strict.** No `any` slipping in.

## Dev loop

```bash
pnpm install
cp .env.example .env       # fill keys
pnpm dev                   # api :4000, web :5173, worker watches queue
pnpm test                  # unit
pnpm test:e2e              # Playwright (web)
pnpm lint && pnpm typecheck
```

## Branching

- Branch from `main`: `feat/short-slug`, `fix/short-slug`.
- Rebase, don't merge `main` into feature branches.
- Squash on merge.

## PR checklist

- [ ] CI green (lint, typecheck, unit, e2e)
- [ ] Linked to an issue
- [ ] Conventional commit title
- [ ] New code has tests
- [ ] Public APIs documented

## Code review

You get an LGTM when:

1. CI is green.
2. A maintainer has reviewed.
3. The change has clear scope (no drive-by reformat).

## Reporting issues

Use the issue tracker. Include:

- What you did
- What you expected
- What happened
- Repro (smaller is better)
- Environment (`pnpm --version`, `node --version`, OS)

## Security

Don't open a public issue for security bugs. See [SECURITY.md](./SECURITY.md).
