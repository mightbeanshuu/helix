# ADR-0002 — Pluggable storage adapter

**Status**: accepted
**Date**: 2026-05-16

## Context

Neo4j is the right primary store for Helix — Cypher is built for the queries
we'll need ("everything reachable from main", "files in a co-change cluster",
PageRank for hotspot weighting). But requiring Docker to *try* the project
is hostile to first-time users.

## Decision

The `@helix/storage` package exposes a `StorageAdapter` interface with two
implementations:

1. **MemoryStorageAdapter** — in-process Map-based, default for dev.
2. **Neo4jStorageAdapter** — production. Selected via `STORAGE_DRIVER=neo4j`.

The factory is the single chokepoint that wires the right one based on env.

## Why

- "`pnpm install && pnpm dev` works without Docker" is a documented acceptance
  criterion.
- We don't pay an abstraction tax beyond one interface — the adapter API is
  intentionally chunky (batch upserts), not row-oriented, so it doesn't
  pretend to be a generic ORM.

## Consequences

- The memory adapter is *not* persistence. Scans evaporate on process restart.
  This is fine for dev/demo and called out clearly in the README.
- Some Cypher-specific projections (full-text search, GDS algorithms) won't
  have a memory equivalent. The API endpoints that depend on them will
  return empty results when `STORAGE_DRIVER=memory`.

## Revisit if

- A third adapter (sqlite-on-disk?) starts to feel necessary for hosted demos.
- The cost of keeping the memory adapter in sync becomes a frequent paper-cut.
