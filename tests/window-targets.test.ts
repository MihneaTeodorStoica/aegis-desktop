import { describe, expect, it } from 'vitest';

import type { WindowInfo } from '../src/backends/types.js';
import { resolvePointInWindow, resolveWindowQuery } from '../src/utils/windowTargets.js';

const windowInfo: WindowInfo = {
  id: '0x1',
  title: 'Visual Studio Code',
  focused: true,
  visible: true,
  geometry: {
    x: 100,
    y: 200,
    width: 1000,
    height: 800
  }
};

describe('resolveWindowQuery', () => {
  it('falls back to the active window when no query is provided', () => {
    expect(resolveWindowQuery({}, [windowInfo], windowInfo)).toBe(windowInfo);
  });
});

describe('resolvePointInWindow', () => {
  it('converts window-relative ratios to absolute screen coordinates', () => {
    expect(resolvePointInWindow(windowInfo, { x_ratio: 0.5, y_ratio: 0.25 })).toEqual({
      x: 600,
      y: 400
    });
  });

  it('converts window-local coordinates to absolute screen coordinates', () => {
    expect(resolvePointInWindow(windowInfo, { x: 10, y: 20 })).toEqual({
      x: 110,
      y: 220
    });
  });
});
