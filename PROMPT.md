# HELIX — Industrial Master Build Prompt

> Feed this to a coding agent (Claude Code, Cursor, etc.) to rebuild Helix from
> scratch. Every section below is a hard contract. Where two options exist, the
> first is the chosen one — change only with explicit reason.

---

## 0. Identity

| Field         | Value                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Name**      | Helix                                                                                                                             |
| **Tagline**   | _Untangle the DNA of any codebase._                                                                                               |
| **One-liner** | Scan any Git repo and produce an interactive map of its architecture, dependencies, hotspots, contributors, and AI-narrated tour. |
| **Repo**      | github.com/mightbeanshuu/helix                                                                                                    |
| **License**   | MIT                                                                                                                               |
| **Status**    | Early build; production-grade scaffolding, iterative feature delivery.                                                            |

---

## 1. Problem & Outcome

**Problem.** Reading a large codebase cold takes weeks. Most "code search" tools
answer "where is the string `foo`?" — they don't answer "how does this system
_work_?"

**Outcome.** A new engineer pastes a Git URL into Helix and within minutes has
(a) a navigable architecture graph, (b) AI-generated summaries of every module,
(c) a guided onboarding tour, and (d) the ability to ask "where is X handled?"
in natural language and get back ranked file paths with rationale.

**Success metric.** A first-time contributor to a 100k-LOC repo can describe
the top-level architecture in their own words after 15 minutes with Helix.

---

## 2. Capabilities (mapped to phases)

### Phase 1 — Ingest & parse (MVP)

- Accept a public Git URL or local path.
- Clone shallow then deepen on demand.
- Detect languages, frameworks, build systems, package managers.
- Parse with **tree-sitter** for: TypeScript/JavaScript, Python, Java, Go,
  Rust, C/C++, Ruby.
- Extract: files, classes, functions, imports, exports, calls, inheritance,
  type references.
- Persist as a property graph (nodes + edges) and per-file embeddings.

### Phase 2 — History & metrics

- Per-file: LOC, cyclomatic complexity, fan-in/fan-out, age, last-touched.
- Per-author: ownership map, expertise areas, contribution graph.
- Churn: commits-per-file over windowed time.
- Co-change: files modified together within N commits (suggests coupling).
- Test coverage overlay if `lcov.info` / `coverage.xml` is present.

### Phase 3 — Visualization

- **Module dependency graph** — packages/modules and their imports.
- **File-level graph** — file imports + co-change edges.
- **Function call graph** — within-module + cross-module.
- **Class hierarchy / inheritance tree.**
- **Contributor heatmap** — who owns what, painted on the file tree.
- **Churn / hotspot map** — files modified most (treemap or fire overlay).
- **Architecture diagram** — auto-inferred C4 (Context → Container → Component).
- **Entry-point map** — `main`, route definitions, CLI handlers, lambdas, cron.
- **Timeline view** — animated codebase evolution.

### Phase 4 — AI layer (Claude)

- Per-module 2-sentence summaries (Haiku for cost, Opus for top-level).
- Missing docstring generation.
- **Semantic search** — natural language → ranked files with rationale.
- **Trace a feature** — given a description, surface every file/function involved.
- **Onboarding tour** — generated top-10 files a newcomer should read, in order.

### Phase 5 — UX polish

- Single-page app: left tree, center canvas, right detail panel.
- Right-click on a node: _Explain_ / _Find similar_ / _Trace callers_ / _Tour from here_.
- ⌘K command palette: jump to file/function/symbol.
- Shareable permalinks per view.
- Keyboard-only navigation parity.

### Phase 6 — Production

- Auth, multi-tenant scan history, share links, public showcase.
- Rate limits, budget caps per scan.
- Observability: OpenTelemetry traces, Prometheus metrics, Grafana dashboards.

---

## 3. Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                          apps/web (React)                         │
│   Cytoscape canvas · TanStack Query · SSE client · ⌘K palette     │
└──────────────────────────────┬────────────────────────────────────┘
                               │ HTTP + SSE
┌──────────────────────────────▼────────────────────────────────────┐
│                       apps/api (Fastify)                          │
│   Zod-validated routes · auth · rate-limit · SSE progress stream  │
└────┬──────────────────────┬─────────────────────────────┬─────────┘
     │                      │                             │
     │  enqueue              │  read/write                │  read/write
     ▼                      ▼                             ▼
┌──────────┐         ┌──────────────┐              ┌──────────────┐
│ Redis    │         │  Neo4j       │              │  Qdrant      │
│ (BullMQ) │         │  (graph)     │              │  (vectors)   │
└────┬─────┘         └──────▲───────┘              └──────▲───────┘
     │                      │                             │
     │ pull jobs            │ persist                     │ persist
     ▼                      │                             │
┌─────────────────────────────────────────────────────────┴─────────┐
│                      apps/worker                                   │
│   clone → detect → parse → analyze → embed → summarize → persist  │
└───────────────────────────────────────────────────────────────────┘
```

### Job pipeline (worker)

```
Enqueue scan
   │
   ├─▶ clone           (isomorphic-git → ./.helix/clones/<sha>)
   ├─▶ detect          (languages, build, package manager)
   ├─▶ parse           (web-tree-sitter, parallel per file)
   ├─▶ analyze         (metrics, churn, contributors, co-change)
   ├─▶ embed           (Voyage AI, batched, retried)
   ├─▶ summarize       (Claude Haiku/Opus, prompt-cached)
   ├─▶ persist         (Neo4j + Qdrant + Postgres metadata)
   └─▶ emit progress   (SSE → API → web)
```

---

## 4. Tech stack (opinionated)

| Layer       | Choice                                                                       |
| ----------- | ---------------------------------------------------------------------------- |
| Language    | **TypeScript 5.6 strict** end-to-end                                         |
| Runtime     | **Node.js 20+**                                                              |
| Backend     | **Fastify 5** + **Zod** + **Pino**                                           |
| Queue       | **BullMQ** on **Redis 7**                                                    |
| Parser      | **web-tree-sitter** (multi-language, WASM)                                   |
| Git         | **isomorphic-git** (no native deps, worker-safe)                             |
| Graph DB    | **Neo4j 5** (pluggable in-memory fallback)                                   |
| Vector DB   | **Qdrant** (gRPC + REST)                                                     |
| Metadata DB | **Postgres 16** (via Drizzle ORM)                                            |
| LLM         | **Claude** — `claude-opus-4-7` (depth), `claude-haiku-4-5-20251001` (volume) |
| Embeddings  | **Voyage AI** `voyage-code-3`                                                |
| Frontend    | **React 18** + **Vite 5** + **TypeScript**                                   |
| Styling     | **Tailwind 3.4** + **Radix UI** (shadcn pattern)                             |
| Graph viz   | **Cytoscape.js 3** (2D), **react-three-fiber** (stretch)                     |
| State       | **TanStack Query 5** + **Zustand 4**                                         |
| Routing     | **TanStack Router**                                                          |
| Tests       | **Vitest** (unit) + **Playwright** (E2E)                                     |
| Lint/format | **ESLint 9** flat config + **Prettier 3**                                    |
| CI          | **GitHub Actions**                                                           |
| Observ.     | **OpenTelemetry** + **Prometheus** + **Grafana**                             |

### Hard rules

- **TypeScript strict everywhere** — `noUncheckedIndexedAccess`, `noImplicitOverride`, all on.
- **All Claude API calls use prompt caching** for the system prompt + repo context.
- **All Claude calls have a per-scan USD budget cap.** Worker aborts if exceeded.
- **Every API endpoint has a Zod request + response schema** and types are inferred — never duplicated.
- **No `any` in production code.** `unknown` + narrow.
- **One-command local boot** — `pnpm install && pnpm dev` works without Docker (uses fallbacks).
- **Re-scans are incremental** — only files whose content hash changed get reparsed.
- **All graph mutations are idempotent** — keyed by stable IDs.

---

## 5. Data contracts

### Nodes (Neo4j labels)

```
(:Repo   { id, url, sha, scannedAt, languages[], stack[] })
(:Module { id, path, name, language, summary })
(:File   { id, path, language, loc, complexity, churn, lastModified, contentHash, summary })
(:Class  { id, name, fqn, file, lineStart, lineEnd })
(:Function { id, name, fqn, file, lineStart, lineEnd, complexity, params, returns })
(:Author { id, name, email, commits })
(:Commit { id, sha, message, authoredAt, authorId, filesChanged })
```

### Edges

```
(:File)-[:IMPORTS]->(:File)
(:Function)-[:CALLS]->(:Function)
(:Class)-[:EXTENDS]->(:Class)
(:Class)-[:IMPLEMENTS]->(:Class)
(:Function)-[:DEFINED_IN]->(:File)
(:Class)-[:DEFINED_IN]->(:File)
(:File)-[:IN_MODULE]->(:Module)
(:Author)-[:AUTHORED]->(:Commit)
(:Commit)-[:MODIFIED]->(:File)
(:File)-[:CO_CHANGED_WITH { weight }]->(:File)
(:File)-[:COVERED_BY]->(:Test)
```

### Embeddings (Qdrant)

```
collection: helix_code
vector_size: 1024 (voyage-code-3)
distance: cosine
payload: { repoId, fileId, kind: "file"|"function"|"class", name, fqn, path, summary }
```

### API contracts (Fastify + Zod)

```
POST   /v1/scans                    body: { url, branch?, token? } → { scanId }
GET    /v1/scans/:id                → ScanStatus
GET    /v1/scans/:id/events         → text/event-stream of ScanProgress
GET    /v1/scans/:id/graph?view=…   → CytoscapeGraph
GET    /v1/scans/:id/tree           → FileTreeNode[]
GET    /v1/scans/:id/file/:fileId   → FileDetail (with summary, metrics, blame)
POST   /v1/scans/:id/ask            body: { question } → { answers: [{ fileId, score, why }] }
POST   /v1/scans/:id/trace          body: { description } → { nodes: [...], edges: [...] }
GET    /v1/scans/:id/tour           → TourStep[]
GET    /v1/health                   → { ok, version, uptimeMs }
```

All responses include `requestId` for tracing. All errors follow RFC 7807
(`application/problem+json`).

---

## 6. File tree (target end-state)

```
helix/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── plugins/{auth,cors,rate-limit,sentry,otel,sse}.ts
│   │   │   ├── routes/{scans,graph,ask,trace,tour,health}.ts
│   │   │   ├── schemas/*.ts            # Zod
│   │   │   ├── services/{queue,storage,events}.ts
│   │   │   └── index.ts
│   │   ├── test/
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── worker/
│   │   ├── src/
│   │   │   ├── pipeline/{clone,detect,parse,analyze,embed,summarize,persist}.ts
│   │   │   ├── queue.ts
│   │   │   ├── progress.ts
│   │   │   └── index.ts
│   │   └── package.json
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── root.tsx
│       │   │   ├── routes/{index,scan/$id,scan/$id/file/$fileId}.tsx
│       │   │   └── router.ts
│       │   ├── components/{Graph,FileTree,DetailPanel,CommandPalette,Tour}/*.tsx
│       │   ├── hooks/*.ts
│       │   ├── lib/{api,sse,cytoscape-styles}.ts
│       │   ├── stores/{ui,scan}.ts
│       │   └── main.tsx
│       ├── index.html
│       ├── tailwind.config.ts
│       └── package.json
├── packages/
│   ├── shared/         (Zod schemas, branded IDs, error types)
│   ├── parser/         (tree-sitter wrappers, language registry)
│   ├── analyzer/       (metrics, churn, co-change, contributors)
│   ├── ai/             (Anthropic SDK wrapper, prompt cache, budget)
│   └── storage/        (Neo4j + Qdrant + memory adapters behind one interface)
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.worker
│   │   └── Dockerfile.web
│   ├── k8s/            (Kustomize: base + overlays/{dev,prod})
│   └── grafana/        (dashboards JSON)
├── .github/workflows/
│   ├── ci.yml          (lint + typecheck + test + build, matrix on Node 20/22)
│   ├── release.yml     (Changesets)
│   └── docker.yml      (build + push images on tag)
├── docs/
│   ├── architecture.md
│   ├── data-model.md
│   ├── prompts.md      (every Claude prompt with version)
│   └── adr/            (architecture decision records)
├── scripts/
│   ├── bootstrap.sh
│   ├── seed-demo.ts
│   └── benchmark.ts
├── .env.example
├── .editorconfig · .gitattributes · .gitignore · .nvmrc
├── .prettierrc · .prettierignore · eslint.config.js
├── Makefile · pnpm-workspace.yaml · tsconfig.base.json · tsconfig.json
├── README.md · PROMPT.md · CONTRIBUTING.md · SECURITY.md · CHANGELOG.md · LICENSE
└── package.json
```

---

## 7. Build order (each step ships green CI)

1. **Phase 0** — Repo, monorepo skeleton, CI, lint, format, README, PROMPT, LICENSE.
2. **Phase 1a** — `packages/shared` types/schemas. `packages/storage` in-memory adapter.
3. **Phase 1b** — `packages/parser` with tree-sitter wired for TS+JS+Python.
4. **Phase 1c** — `apps/worker` clone+parse pipeline (no AI yet). Emits events.
5. **Phase 1d** — `apps/api` with `POST /scans`, `GET /scans/:id`, SSE events.
6. **Phase 1e** — `apps/web` minimal: URL form → progress stream → file tree + raw graph.
7. **Phase 2** — Git history (churn, contributors, co-change) in analyzer.
8. **Phase 3** — Cytoscape graph polish, detail panel, ⌘K palette, filters.
9. **Phase 4** — `packages/ai`: summaries → semantic search → trace → tour.
10. **Phase 5** — C4 inference, evolution timeline, coverage overlay.
11. **Phase 6** — Auth, multi-user, observability, K8s, public showcase.

---

## 8. Acceptance criteria — v1

- [ ] Paste `https://github.com/django/django` → navigable map within **5 min** on a M-class laptop.
- [ ] Ask "where is request routing handled?" → top result is `django/urls/resolvers.py` (or equivalent) with rationale.
- [ ] AI-generated onboarding tour for the same repo is **≤10 steps** and a reviewer can summarize the architecture afterwards.
- [ ] Graphs interactive at **60fps** for repos up to **500k LOC**.
- [ ] Re-scan after a commit on the same repo: **only changed files reparsed**; total time **<10%** of first scan.
- [ ] CI green on every PR: lint, typecheck, unit, E2E.
- [ ] `pnpm install && pnpm dev` works on a fresh machine with **no Docker**, using fallbacks.

---

## 9. Non-goals (explicit)

- Code editing / refactoring. Helix is read-only.
- Replacing GitHub. We _complement_ it.
- Real-time collaboration. (Not in v1.)
- Static analysis depth that competes with SonarQube. Use existing tools and ingest their output.
- Mobile app. Desktop web only in v1.

---

## 10. Operating constraints

- **Anthropic API**: every call uses prompt caching; system + repo context cached.
  Per-scan budget cap (USD) configurable via env, default $5. Hard stop on exceed.
- **Concurrency**: parser worker pool sized to `cpus - 1`. Embedding batches: 64.
- **Disk**: clones expire after 24h unless pinned. Storage GCed nightly.
- **Privacy**: no repo contents leave the user's machine unless they explicitly
  enable hosted mode. Local mode is the default.
- **Determinism**: same repo SHA → identical graph + metrics. Summaries are
  stochastic but cached on `(model, prompt-hash)`.

---

## 11. The prompt to begin

> You are an engineer building Helix as specified in this document. Start with
> Phase 0 only. Output the file tree first. Then create every file with content,
> in dependency order. After Phase 0 lands green on CI, **stop and report**.
> Do not begin Phase 1 until I confirm.
