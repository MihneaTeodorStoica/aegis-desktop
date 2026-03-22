import { describe, expect, it } from 'vitest';

import { internal } from '../src/backends/windows/x11WindowBackend.js';

describe('parseWmctrlList', () => {
  it('parses wmctrl -lx output', () => {
    const windows = internal.parseWmctrlList(
      '0x04800007  0 host Navigator.Firefox Mozilla Firefox\n'
    );

    expect(windows).toHaveLength(1);
    expect(windows[0]?.id).toBe('0x04800007');
    expect(windows[0]?.className).toBe('Firefox');
    expect(windows[0]?.instanceName).toBe('Navigator');
    expect(windows[0]?.title).toBe('Mozilla Firefox');
  });
});
