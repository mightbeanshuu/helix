# Data model

## Nodes

| Label | Properties |
| --- | --- |
| `Scan` | `id`, `url`, `sha`, `stage`, `percent`, `startedAt`, `finishedAt?`, `error?`, `costUsd?` |
| `Module` | `id`, `scanId`, `path`, `name`, `language`, `summary?` |
| `File` | `id`, `scanId`, `path`, `language`, `loc`, `complexity`, `churn`, `contentHash`, `lastModified?`, `summary?` |
| `Class` | `id`, `fileId`, `name`, `fqn`, `lineStart`, `lineEnd`, `extends?`, `implements?` |
| `Function` | `id`, `fileId`, `classId?`, `name`, `fqn`, `lineStart`, `lineEnd`, `complexity`, `params`, `returns?`, `isAsync?`, `isExported` |
| `Author` | `id`, `name`, `email?`, `commits` |
| `Commit` | `id`, `scanId`, `sha`, `message`, `authoredAt`, `authorId`, `files` |

## Edges

| Type | From → To |
| --- | --- |
| `IN_SCAN` | `File\|Module\|Class\|Function` → `Scan` |
| `IN_MODULE` | `File` → `Module` |
| `IMPORTS` | `File` → `File` |
| `CALLS` | `Function` → `Function` |
| `EXTENDS` | `Class` → `Class` |
| `IMPLEMENTS` | `Class` → `Class` |
| `DEFINED_IN` | `Class\|Function` → `File` |
| `AUTHORED` | `Author` → `Commit` |
| `MODIFIED` | `Commit` → `File` |
| `CO_CHANGED_WITH` | `File` → `File` (with `weight`) |
| `COVERED_BY` | `File` → `Test` |

## Vector store (Qdrant)

```
collection:  helix_code
vector_size: 1024 (voyage-code-3)
distance:    cosine

payload:
  repoId: string
  fileId: string
  kind: "file" | "function" | "class"
  name: string
  fqn: string
  path: string
  summary: string
```
