# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Phase 0: monorepo skeleton (pnpm workspaces, TS project refs, ESLint 9, Prettier).
- `apps/api` Fastify skeleton with Zod-validated routes and SSE events.
- `apps/worker` BullMQ scaffold with pluggable pipeline stages.
- `apps/web` Vite + React + Tailwind shell with router and global state.
- `packages/shared`, `packages/parser`, `packages/analyzer`, `packages/ai`, `packages/storage`.
- `infra/docker/docker-compose.yml` for Neo4j, Qdrant, Redis, Postgres.
- GitHub Actions CI matrix (lint, typecheck, test, build).
