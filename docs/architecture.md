# Architecture

This document accompanies [PROMPT.md](../PROMPT.md). Read that first.

## Request flow — a new scan

```
Browser                  API                     Queue                Worker             Storage
  │                       │                       │                     │                   │
  │ POST /v1/scans        │                       │                     │                   │
  │──────────────────────▶│                       │                     │                   │
  │                       │ createScan()          │                     │                   │
  │                       │──────────────────────────────────────────────────────────────▶ │
  │                       │ queue.add('scan')     │                     │                   │
  │                       │──────────────────────▶│                     │                   │
  │                       │                       │  scan job           │                   │
  │                       │                       │────────────────────▶│                   │
  │ 202 { scanId }        │                       │                     │  clone            │
  │◀──────────────────────│                       │                     │ ───────────────▶  │
  │                       │                       │                     │  detect+parse     │
  │ GET /events (SSE)     │                       │                     │  analyze          │
  │──────────────────────▶│                       │                     │  persist          │
  │                       │  (Redis pub/sub)      │                     │ ──────────────▶   │
  │ event: progress       │◀──────────────────────────────────────────│                   │
  │◀──────────────────────│                       │                     │                   │
  │ ...                   │                       │                     │                   │
  │ event: done           │                       │                     │                   │
  │◀──────────────────────│                       │                     │                   │
  │ GET /graph + /tree    │                       │                     │                   │
  │──────────────────────▶│ ──────────────────────────────────────────────────────────────▶ │
  │ render Cytoscape      │                       │                     │                   │
```

## Why these choices

- **Fastify** over Express: ~3× the throughput, native schema-driven serialization, the type provider plays nicely with Zod.
- **BullMQ** over a homegrown queue: durable retries, visibility into stuck jobs, and Redis is already in the stack for pub/sub.
- **tree-sitter** over language-specific compilers: one API across 7+ languages, error-resilient (parses partial input), runs in the worker without spawning subprocesses.
- **isomorphic-git** over native git: zero native dependencies, runs identically inside a Docker slim image and on macOS.
- **Neo4j** as the primary graph store: Cypher is the right query language for asking *"every function reachable from main"*. We make it optional via the storage adapter so dev doesn't need Docker.
- **Cytoscape.js** over D3 for graph rendering: handles 10k+ node graphs at 60fps with fcose layout, has the affordances (lasso select, panning, clustering) for free.

## Data lifecycle

1. **Clone** is content-addressed by the repo URL hash. Repeat scans of the same URL reuse the directory.
2. **Parse** stage hashes file contents (SHA-256). On re-scan, files whose hash is unchanged skip parsing.
3. **Persist** writes to the graph store via idempotent `MERGE` queries. Re-running a scan over an unchanged repo produces the same graph.
4. **Embeddings** are cached on `(repoSha, fileHash)` in Qdrant payloads, so re-summarization is cheap.
5. **Cleanup**: clones older than 24h are deleted nightly. Storage is GCed weekly unless a scan has been "pinned".

## Failure modes

| Failure | Behaviour |
| --- | --- |
| Redis down | API still responds; queue calls fail loudly. Worker keeps retrying connect. SSE falls back to polling-only. |
| Anthropic 429 | Retries with jittered backoff up to 4 attempts; on persistent failure the scan continues without summaries. |
| Anthropic budget exceeded | Throws `BudgetExceededError`; summarize stage is skipped, scan still completes with graph data. |
| Tree-sitter parse error in one file | File is recorded but its symbols/imports are empty. Scan continues. |
| Git clone failure | Scan fails with `CloneError`; visible in `ScanStatus.error`. |
| Worker crash mid-scan | BullMQ marks the job failed; user sees `failed` stage with the error message. |

## Observability (phase 6)

- **Traces**: OpenTelemetry SDK, exporting to OTLP. Span every pipeline stage.
- **Metrics**: Prometheus scrape endpoint on the API + worker. Histograms for stage duration, counters for files processed and tokens spent.
- **Dashboards**: Grafana JSON in `infra/grafana/`.
