import { z } from 'zod';

import { SCAN_STAGES, SUPPORTED_LANGUAGES } from './constants.js';

export const LanguageSchema = z.enum(SUPPORTED_LANGUAGES);
export const ScanStageSchema = z.enum(SCAN_STAGES);

export const GitUrlSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine(
    (v) =>
      /^https?:\/\//i.test(v) ||
      /^git@[^:]+:.+/.test(v) ||
      /^ssh:\/\//i.test(v) ||
      /^file:\/\//i.test(v) ||
      v.startsWith('/'),
    { message: 'Must be an http(s), ssh, git@, file:// URL, or absolute path' },
  );

export const CreateScanRequest = z
  .object({
    url: GitUrlSchema,
    branch: z.string().min(1).max(255).optional(),
    token: z.string().min(1).max(512).optional(),
    depth: z.number().int().positive().max(10_000).optional(),
    languages: z.array(LanguageSchema).optional(),
  })
  .strict();
export type CreateScanRequest = z.infer<typeof CreateScanRequest>;

export const CreateScanResponse = z.object({
  scanId: z.string(),
  url: z.string(),
  status: z.literal('queued'),
});
export type CreateScanResponse = z.infer<typeof CreateScanResponse>;

export const ScanProgress = z.object({
  scanId: z.string(),
  stage: ScanStageSchema,
  percent: z.number().min(0).max(100),
  message: z.string(),
  filesProcessed: z.number().int().nonnegative().optional(),
  filesTotal: z.number().int().nonnegative().optional(),
  costUsd: z.number().nonnegative().optional(),
  at: z.string().datetime(),
});
export type ScanProgress = z.infer<typeof ScanProgress>;

export const ScanStatus = z.object({
  scanId: z.string(),
  url: z.string(),
  sha: z.string().optional(),
  stage: ScanStageSchema,
  percent: z.number().min(0).max(100),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  error: z.string().optional(),
  costUsd: z.number().nonnegative().optional(),
  stats: z
    .object({
      files: z.number().int().nonnegative(),
      classes: z.number().int().nonnegative(),
      functions: z.number().int().nonnegative(),
      imports: z.number().int().nonnegative(),
      commits: z.number().int().nonnegative(),
      authors: z.number().int().nonnegative(),
      languages: z.record(z.string(), z.number()),
    })
    .optional(),
});
export type ScanStatus = z.infer<typeof ScanStatus>;

export const GraphNode = z.object({
  data: z.object({
    id: z.string(),
    label: z.string(),
    kind: z.enum(['module', 'file', 'class', 'function', 'package']),
    path: z.string().optional(),
    language: LanguageSchema.optional(),
    loc: z.number().int().nonnegative().optional(),
    complexity: z.number().nonnegative().optional(),
    churn: z.number().nonnegative().optional(),
    hotspot: z.number().min(0).max(1).optional(),
    parent: z.string().optional(),
  }),
});
export type GraphNode = z.infer<typeof GraphNode>;

export const GraphEdge = z.object({
  data: z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    kind: z.enum([
      'imports',
      'calls',
      'extends',
      'implements',
      'contains',
      'co-changed',
      'covers',
    ]),
    weight: z.number().nonnegative().optional(),
  }),
});
export type GraphEdge = z.infer<typeof GraphEdge>;

export const CytoscapeGraph = z.object({
  nodes: z.array(GraphNode),
  edges: z.array(GraphEdge),
});
export type CytoscapeGraph = z.infer<typeof CytoscapeGraph>;

export const FileTreeNode: z.ZodType<FileTreeNodeShape> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    path: z.string(),
    type: z.enum(['file', 'dir']),
    language: LanguageSchema.optional(),
    loc: z.number().int().nonnegative().optional(),
    churn: z.number().nonnegative().optional(),
    children: z.array(FileTreeNode).optional(),
  }),
);
export interface FileTreeNodeShape {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'dir';
  language?: (typeof SUPPORTED_LANGUAGES)[number];
  loc?: number;
  churn?: number;
  children?: FileTreeNodeShape[];
}

export const FileDetail = z.object({
  id: z.string(),
  path: z.string(),
  language: LanguageSchema,
  loc: z.number().int().nonnegative(),
  complexity: z.number().nonnegative(),
  churn: z.number().nonnegative(),
  lastModified: z.string().datetime().optional(),
  summary: z.string().optional(),
  imports: z.array(z.string()),
  exports: z.array(z.string()),
  classes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      lineStart: z.number().int().positive(),
      lineEnd: z.number().int().positive(),
    }),
  ),
  functions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      lineStart: z.number().int().positive(),
      lineEnd: z.number().int().positive(),
      complexity: z.number().nonnegative(),
    }),
  ),
  contributors: z.array(
    z.object({ name: z.string(), email: z.string().optional(), commits: z.number().int() }),
  ),
});
export type FileDetail = z.infer<typeof FileDetail>;

export const AskRequest = z.object({ question: z.string().min(3).max(500) }).strict();
export const AskResponse = z.object({
  answers: z.array(
    z.object({
      fileId: z.string(),
      path: z.string(),
      score: z.number().min(0).max(1),
      why: z.string(),
    }),
  ),
});
export type AskRequest = z.infer<typeof AskRequest>;
export type AskResponse = z.infer<typeof AskResponse>;

export const TraceRequest = z.object({ description: z.string().min(3).max(1000) }).strict();
export const TourStep = z.object({
  step: z.number().int().positive(),
  fileId: z.string(),
  path: z.string(),
  why: z.string(),
  highlights: z.array(z.string()).optional(),
});
export const Tour = z.object({ steps: z.array(TourStep) });
export type TourStep = z.infer<typeof TourStep>;
export type Tour = z.infer<typeof Tour>;
