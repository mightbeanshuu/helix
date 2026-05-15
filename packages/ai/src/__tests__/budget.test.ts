import { BudgetExceededError } from '@helix/shared';
import { describe, expect, it } from 'vitest';

import { BudgetTracker } from '../budget.js';

describe('BudgetTracker', () => {
  it('charges and accumulates cost', () => {
    const t = new BudgetTracker(10);
    const cost = t.charge('claude-haiku-4-5-20251001', {
      inputTokens: 1_000_000,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    });
    expect(cost).toBeCloseTo(0.8, 5);
    expect(t.total).toBeCloseTo(0.8, 5);
  });

  it('throws when the budget is exceeded', () => {
    const t = new BudgetTracker(0.1);
    expect(() =>
      t.charge('claude-opus-4-7', {
        inputTokens: 1_000_000,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      }),
    ).toThrow(BudgetExceededError);
  });
});
