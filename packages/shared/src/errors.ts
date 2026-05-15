/**
 * Helix error hierarchy. Every error carries an HTTP status and a stable
 * machine-readable `type` so clients can switch on it.
 */
export class HelixError extends Error {
  readonly type: string;
  readonly status: number;
  readonly detail?: string;
  readonly meta?: Record<string, unknown>;

  constructor(opts: {
    type: string;
    status: number;
    message: string;
    detail?: string;
    meta?: Record<string, unknown>;
    cause?: unknown;
  }) {
    super(opts.message, { cause: opts.cause });
    this.name = this.constructor.name;
    this.type = opts.type;
    this.status = opts.status;
    if (opts.detail !== undefined) this.detail = opts.detail;
    if (opts.meta !== undefined) this.meta = opts.meta;
  }

  toProblem(): Record<string, unknown> {
    return {
      type: this.type,
      title: this.message,
      status: this.status,
      ...(this.detail !== undefined && { detail: this.detail }),
      ...(this.meta !== undefined && { meta: this.meta }),
    };
  }
}

export class ValidationError extends HelixError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super({ type: 'helix:validation', status: 400, message, ...(meta && { meta }) });
  }
}

export class NotFoundError extends HelixError {
  constructor(resource: string, id?: string) {
    super({
      type: 'helix:not-found',
      status: 404,
      message: `${resource} not found`,
      ...(id !== undefined && { detail: `id=${id}` }),
    });
  }
}

export class ConflictError extends HelixError {
  constructor(message: string) {
    super({ type: 'helix:conflict', status: 409, message });
  }
}

export class RateLimitError extends HelixError {
  constructor(retryAfterMs: number) {
    super({
      type: 'helix:rate-limit',
      status: 429,
      message: 'Rate limit exceeded',
      meta: { retryAfterMs },
    });
  }
}

export class UpstreamError extends HelixError {
  constructor(service: string, cause: unknown) {
    super({
      type: 'helix:upstream',
      status: 502,
      message: `Upstream failure: ${service}`,
      cause,
    });
  }
}

export class BudgetExceededError extends HelixError {
  constructor(spentUsd: number, budgetUsd: number) {
    super({
      type: 'helix:budget-exceeded',
      status: 402,
      message: 'Per-scan LLM budget exceeded',
      meta: { spentUsd, budgetUsd },
    });
  }
}

export class CloneError extends HelixError {
  constructor(url: string, cause: unknown) {
    super({
      type: 'helix:clone',
      status: 422,
      message: 'Failed to clone repository',
      meta: { url },
      cause,
    });
  }
}
