<div align="center">

# 🧬 Helix

### *Untangle the DNA of any codebase.*

Helix ingests any Git repository and produces an interactive, navigable map of the
entire codebase — its architecture, dependencies, hotspots, contributors, and
evolution — so a new engineer can understand it in **minutes** instead of weeks.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9-orange)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org)
[![Status](https://img.shields.io/badge/status-WIP-yellow)](#status)

</div>

---

## ✨ What it does

Paste in a Git URL. Helix clones it, parses every supported language with
[tree-sitter](https://tree-sitter.github.io/), pulls full history with
[isomorphic-git](https://isomorphic-git.org), runs metrics + graph extraction,
embeds every file/function with [Voyage AI](https://voyageai.com), and asks
[Claude](https://anthropic.com) to summarize each module. The result is an
interactive atlas:

| | |
|---|---|
| 🗺️ **Module + file dependency graph** | Drag, zoom, filter, cluster |
| 🔥 **Hotspot map** | Churn × complexity overlay |
| 👥 **Contributor heatmap** | Who owns what |
| 🏛️ **Auto-inferred architecture** | C4-style: Context → Container → Component |
| 🔍 **Semantic search** | "Where is auth handled?" |
| 🧭 **Onboarding tour** | AI-generated guided walkthrough of the top files |
| 🎯 **Trace a feature** | Surface every file/function involved |
| ⏳ **Evolution timeline** | Codebase shape over time |

See [PROMPT.md](./PROMPT.md) for the full product spec / master build prompt.

---

## 🚀 Quickstart

```bash
# 1. Clone
git clone https://github.com/mightbeanshuu/helix.git
cd helix

# 2. Install (Node 20+, pnpm 9+)
corepack enable
pnpm install

# 3. Configure
cp .env.example .env
# add ANTHROPIC_API_KEY and VOYAGE_API_KEY

# 4. (Optional) Start infra — Neo4j / Qdrant / Redis
make infra-up        # requires Docker

# 5. Run everything in dev
pnpm dev             # api on :4000, web on :5173, worker watches queue

# 6. Open http://localhost:5173
```

Without Docker the app falls back to an in-memory store — great for kicking the tyres,
not for repos > 50k LOC.

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Ingestion      │ ──▶ │  Analysis Engine │ ──▶ │  Graph Store    │
│  (clone, detect)│     │  (AST, git, AI)  │     │  (Neo4j / mem)  │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                              ┌───────────────────────────┤
                              ▼                           ▼
                     ┌─────────────────┐         ┌─────────────────┐
                     │  API (Fastify)  │         │  Vector Store   │
                     │  + SSE          │◀────────│  (Qdrant)       │
                     └────────┬────────┘         └─────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  Web (React)    │
                     │  + Cytoscape    │
                     └─────────────────┘
```

### Monorepo layout

```
helix/
├── apps/
│   ├── api/         Fastify HTTP + SSE server
│   ├── worker/      BullMQ consumer (clone → parse → analyze → embed → persist)
│   └── web/         Vite + React 18 + Tailwind + Cytoscape
├── packages/
│   ├── shared/      Cross-cutting types + schemas (Zod)
│   ├── parser/      tree-sitter wrappers per language
│   ├── analyzer/    Metrics, graph builder, churn, co-change
│   ├── ai/          Anthropic SDK wrapper (prompt caching, retries, budget)
│   └── storage/     Pluggable graph + vector storage adapters
├── infra/
│   ├── docker/      docker-compose for Neo4j / Qdrant / Redis / Postgres
│   ├── k8s/         Kustomize manifests (production)
│   └── grafana/     Dashboards
└── .github/workflows/  CI: lint · typecheck · test · build
```

---

## 🧰 Tech stack

| Layer       | Choice                                                    |
| ----------- | --------------------------------------------------------- |
| Language    | **TypeScript 5.6 strict** end-to-end                      |
| Backend     | **Fastify 5** + **Zod** + **Pino** + **BullMQ**           |
| Parser      | **web-tree-sitter** (TS/JS, Python, Java, Go, Rust, C++)  |
| Git         | **isomorphic-git** (no native deps, works in workers)     |
| Graph DB    | **Neo4j 5** (pluggable: in-memory fallback for dev)       |
| Vector DB   | **Qdrant**                                                |
| Queue       | **Redis** + **BullMQ**                                    |
| LLM         | **Claude** (`claude-opus-4-7` + `claude-haiku-4-5`)       |
| Embeddings  | **Voyage AI** `voyage-code-3`                             |
| Frontend    | **React 18** + **Vite** + **Tailwind** + **Radix UI**     |
| Graphs      | **Cytoscape.js** (2D), **react-three-fiber** (3D stretch) |
| State       | **TanStack Query** + **Zustand**                          |
| Tests       | **Vitest** (unit) + **Playwright** (E2E)                  |
| CI          | **GitHub Actions**                                        |

---

## 🎯 Roadmap

- [x] Phase 0 — Monorepo skeleton, CI, lint, format
- [ ] Phase 1 — Clone + parse one language → Neo4j → minimal graph UI
- [ ] Phase 2 — Multi-language + git history + churn + contributors
- [ ] Phase 3 — Visualization polish (clustering, filters, detail panel)
- [ ] Phase 4 — AI layer (summaries, semantic search, trace-a-feature, tour)
- [ ] Phase 5 — Architecture inference (C4) + evolution timeline
- [ ] Phase 6 — Hosted multi-user with auth + share links

See [PROMPT.md](./PROMPT.md) for the full spec.

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). TL;DR: open an issue, branch from `main`,
conventional commits, PR.

## 🔐 Security

Found a vulnerability? See [SECURITY.md](./SECURITY.md).

## 📄 License

[MIT](./LICENSE) © 2026 mightbeanshuu
