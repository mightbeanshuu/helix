import { describe, expect, it } from 'vitest';

import { isScanId, newScanId } from '../ids.js';

describe('ids', () => {
  it('generates ids with the expected prefix', () => {
    const id = newScanId();
    expect(id.startsWith('scn_')).toBe(true);
    expect(isScanId(id)).toBe(true);
  });

  it('does not consider random strings as scan ids', () => {
    expect(isScanId('not-an-id')).toBe(false);
    expect(isScanId('fil_abc123')).toBe(false);
  });
});
