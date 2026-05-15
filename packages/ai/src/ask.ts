import { type AskResponse, UpstreamError } from '@helix/shared';
import { z } from 'zod';

import type { HelixAI } from './client.js';
import { PROMPTS } from './prompts.js';

const RawSchema = z.object({
  answers: z
    .array(
      z.object({
        fileId: z.string(),
        score: z.number().min(0).max(1),
        why: z.string(),
      }),
    )
    .max(5),
});

export interface AskCandidateFile {
  fileId: string;
  path: string;
  summary?: string;
  head?: string;
}

export async function askCodebase(
  ai: HelixAI,
  question: string,
  candidates: AskCandidateFile[],
): Promise<AskResponse> {
  const context = candidates
    .map(
      (c) =>
        `<file id="${c.fileId}" path="${c.path}">${c.summary ?? c.head ?? ''}</file>`,
    )
    .join('\n');

  const result = await ai.complete({
    system: PROMPTS.semanticSearch.system,
    context,
    user: `Question: ${question}\n\nReturn JSON now.`,
    prefill: '{',
    maxTokens: 700,
    temperature: 0.1,
  });

  let parsed: z.infer<typeof RawSchema>;
  try {
    parsed = RawSchema.parse(JSON.parse(`{${result.text}`));
  } catch (err) {
    throw new UpstreamError('claude:ask', err);
  }
  const pathById = new Map(candidates.map((c) => [c.fileId, c.path]));
  return {
    answers: parsed.answers
      .filter((a) => pathById.has(a.fileId))
      .map((a) => ({ ...a, path: pathById.get(a.fileId) ?? '' })),
  };
}
