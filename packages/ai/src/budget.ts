import { BudgetExceededError } from '@helix/shared';

/**
 * Per-scan USD budget. Every Claude call routes through `charge()` which
 * throws once the cap is hit. Pricing is conservative — we err on charging
 * a little more than Anthropic's headline price.
 */
export interface ModelPricing {
  /** USD per 1M input tokens */
  input: number;
  /** USD per 1M output tokens */
  output: number;
  /** USD per 1M cached input tokens (5m TTL) */
  cacheRead: number;
  /** USD per 1M cache-write input tokens */
  cacheWrite: number;
}

export const PRICING: Record<string, ModelPricing> = {
  'claude-opus-4-7': { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  'claude-sonnet-4-6': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 },
};

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export class BudgetTracker {
  private spent = 0;

  constructor(private readonly capUsd: number) {}

  cost(model: string, usage: Usage): number {
    const p = PRICING[model] ?? PRICING['claude-haiku-4-5-20251001'];
    if (!p) return 0;
    return (
      (usage.inputTokens * p.input) / 1e6 +
      (usage.outputTokens * p.output) / 1e6 +
      (usage.cacheReadTokens * p.cacheRead) / 1e6 +
      (usage.cacheWriteTokens * p.cacheWrite) / 1e6
    );
  }

  charge(model: string, usage: Usage): number {
    const c = this.cost(model, usage);
    this.spent += c;
    if (this.spent > this.capUsd) {
      throw new BudgetExceededError(this.spent, this.capUsd);
    }
    return c;
  }

  remaining(): number {
    return Math.max(0, this.capUsd - this.spent);
  }

  get total(): number {
    return this.spent;
  }
}
