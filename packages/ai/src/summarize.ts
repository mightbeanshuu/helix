import { PROMPTS } from './prompts.js';

import type { HelixAI } from './client.js';

export interface ModuleSummaryInput {
  modulePath: string;
  fileSamples: { path: string; head: string }[];
  ambientContext?: string;
}

/**
 * Asks Claude (Haiku by default — this is high-volume) for a 2-sentence
 * summary of a module given a sample of its files.
 */
export async function summarizeModule(
  ai: HelixAI,
  input: ModuleSummaryInput,
  opts: { model?: string } = {},
): Promise<string> {
  const context = input.fileSamples
    .map((s) => `// FILE: ${s.path}\n${s.head}`)
    .join('\n\n---\n\n');

  const result = await ai.complete({
    ...(opts.model && { model: opts.model }),
    system: PROMPTS.moduleSummary.system,
    ...(input.ambientContext && { context: input.ambientContext }),
    user: `Module path: ${input.modulePath}\n\nFile snippets:\n\n${context}\n\nWrite the 2-sentence summary now.`,
    maxTokens: 200,
    temperature: 0.2,
  });

  return result.text.trim();
}
