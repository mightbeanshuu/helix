import { describe, expect, it } from 'vitest';

import { BudgetExceededError, NotFoundError, ValidationError } from '../errors.js';

describe('errors', () => {
  it('NotFoundError has 404 status and stable type', () => {
    const err = new NotFoundError('Scan', 'scn_123');
    expect(err.status).toBe(404);
    expect(err.type).toBe('helix:not-found');
    expect(err.toProblem()).toMatchObject({ status: 404, title: 'Scan not found' });
  });

  it('ValidationError serializes meta', () => {
    const err = new ValidationError('bad input', { field: 'url' });
    expect(err.toProblem()).toMatchObject({ status: 400, meta: { field: 'url' } });
  });

  it('BudgetExceededError carries spend + cap', () => {
    const err = new BudgetExceededError(6.5, 5);
    expect(err.meta).toMatchObject({ spentUsd: 6.5, budgetUsd: 5 });
  });
});
