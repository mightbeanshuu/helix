import { type Tour, UpstreamError } from '@helix/shared';
import { z } from 'zod';

import type { HelixAI } from './client.js';
import { PROMPTS } from './prompts.js';

const RawSchema = z.object({
  steps: z.array(
    z.object({
      step: z.number().int().positive(),
      fileId: z.string(),
      path: z.string(),
      why: z.string(),
      highlights: z.array(z.string()).optional(),
    }),
  ),
});

export interface TourFile {
  fileId: string;
  path: string;
  summary?: string;
  importance?: number;
}

export async function generateTour(ai: HelixAI, files: TourFile[]): Promise<Tour> {
  const ranked = [...files]
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
    .slice(0, 40);
  const context = ranked
    .map(
      (f) =>
        `<file id="${f.fileId}" path="${f.path}" importance="${f.importance ?? 0}">${
          f.summary ?? ''
        }</file>`,
    )
    .join('\n');

  const result = await ai.complete({
    system: PROMPTS.tour.system,
    context,
    user: 'Generate the 10-step onboarding tour now.',
    prefill: '{',
    maxTokens: 1500,
    temperature: 0.2,
  });

  try {
    return RawSchema.parse(JSON.parse(`{${result.text}`));
  } catch (err) {
    throw new UpstreamError('claude:tour', err);
  }
}
