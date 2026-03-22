import { describe, expect, it } from 'vitest';

import { findBestTextMatch } from '../src/utils/matching.js';

describe('findBestTextMatch', () => {
  it('prefers exact matches', () => {
    const result = findBestTextMatch('Firefox', [
      { value: 1, text: 'Firefox' },
      { value: 2, text: 'Mozilla Firefox' }
    ]);

    expect(result?.value).toBe(1);
    expect(result?.strategy).toBe('exact');
  });

  it('falls back to contains matches', () => {
    const result = findBestTextMatch('browser', [
      { value: 1, text: 'File Manager' },
      { value: 2, text: 'Browser - Work' }
    ]);

    expect(result?.value).toBe(2);
    expect(result?.strategy).toBe('contains');
  });
});
