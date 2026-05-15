import Anthropic from '@anthropic-ai/sdk';

import { BudgetTracker, type Usage } from './budget.js';

export interface HelixAIConfig {
  apiKey: string;
  defaultModel: string;
  fastModel: string;
  budgetUsd: number;
}

export interface CompleteArgs {
  /** Model id; falls back to config.defaultModel */
  model?: string;
  /** Static system prompt — gets cache-control ephemeral attached */
  system: string;
  /** Optional repo-context block — cached so re-asking is cheap */
  context?: string;
  /** The actual user question / instruction */
  user: string;
  /** Optional assistant prefill */
  prefill?: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

export interface CompleteResult {
  text: string;
  model: string;
  usage: Usage;
  costUsd: number;
}

/**
 * Thin wrapper around Anthropic SDK with:
 *  - automatic prompt caching on system + context
 *  - per-scan budget tracking
 *  - retries with jittered backoff for 429/5xx
 */
export class HelixAI {
  private readonly anthropic: Anthropic;
  readonly budget: BudgetTracker;

  constructor(private readonly cfg: HelixAIConfig) {
    this.anthropic = new Anthropic({ apiKey: cfg.apiKey });
    this.budget = new BudgetTracker(cfg.budgetUsd);
  }

  async complete(args: CompleteArgs): Promise<CompleteResult> {
    const model = args.model ?? this.cfg.defaultModel;

    // The SDK types for prompt caching lag the API; cast to a structural shape
    // that includes cache_control until the SDK ships them. The runtime API
    // accepts these fields today.
    const systemBlocks = [
      { type: 'text', text: args.system, cache_control: { type: 'ephemeral' } },
    ];
    if (args.context && args.context.length > 0) {
      systemBlocks.push({
        type: 'text',
        text: args.context,
        cache_control: { type: 'ephemeral' },
      });
    }

    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: args.user }];
    if (args.prefill) messages.push({ role: 'assistant', content: args.prefill });

    const response = await this.withRetry(() =>
      this.anthropic.messages.create({
        model,
        max_tokens: args.maxTokens ?? 2048,
        ...(args.temperature !== undefined && { temperature: args.temperature }),
        ...(args.stopSequences && { stop_sequences: args.stopSequences }),
        system: systemBlocks as unknown as Anthropic.TextBlockParam[],
        messages,
      }),
    );

    const respUsage = response.usage as unknown as {
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
    const usage: Usage = {
      inputTokens: respUsage.input_tokens,
      outputTokens: respUsage.output_tokens,
      cacheReadTokens: respUsage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: respUsage.cache_creation_input_tokens ?? 0,
    };
    const costUsd = this.budget.charge(model, usage);

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    return { text, model, usage, costUsd };
  }

  private async withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const status = (err as { status?: number }).status;
        if (status && status < 500 && status !== 429) throw err;
        const delay = Math.min(8000, 250 * 2 ** i) + Math.random() * 250;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastErr;
  }
}
