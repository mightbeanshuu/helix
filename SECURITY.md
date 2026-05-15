# Security Policy

## Reporting a vulnerability

Email **amananshu2004@gmail.com** with subject `HELIX-SECURITY: <short title>`.

Please do **not** open public issues for security bugs. We'll acknowledge within
72 hours and aim to fix critical issues within 14 days.

## Scope

In-scope:

- Code execution in the worker (e.g., via crafted repo contents).
- Path traversal during clone/parse.
- Unauthenticated access to scan data.
- API key leakage.
- Server-side request forgery via the clone URL.

Out-of-scope:

- Issues that require a malicious local user.
- Rate-limit bypass without an underlying impact.
- Findings from automated scanners without a working exploit.

## Hardening commitments

- Never log API keys or full request bodies at `info` level.
- All clones run with constrained filesystem scope (`./.helix/clones/<scanId>`).
- All external URLs are validated against an allowlist scheme (`http(s)`, `git`).
- Anthropic + Voyage API keys are loaded at boot, never per-request from headers.
