import { describe, expect, it } from 'vitest';

import { buildLinuxScreenshotCommand } from '../src/backends/screenshot/linuxScreenshotBackend.js';
import { buildWaylandScreenshotCommand } from '../src/backends/screenshot/waylandScreenshotBackend.js';

describe('screenshot command builders', () => {
  it('builds a maim region command', () => {
    const [command, args] = buildLinuxScreenshotCommand('maim', {
      mode: 'region',
      region: { x: 10, y: 20, width: 300, height: 200 },
      outputPath: '/tmp/test.png'
    });

    expect(command).toBe('maim');
    expect(args).toEqual(['-g', '300x200+10+20', '/tmp/test.png']);
  });

  it('rejects deterministic gnome region capture on x11 backend', () => {
    expect(() =>
      buildLinuxScreenshotCommand('gnome-screenshot', {
        mode: 'region',
        region: { x: 10, y: 20, width: 300, height: 200 },
        outputPath: '/tmp/test.png'
      })
    ).toThrow();
  });

  it('builds a grim region command', () => {
    const [command, args] = buildWaylandScreenshotCommand('grim', {
      mode: 'region',
      region: { x: 1, y: 2, width: 3, height: 4 },
      outputPath: '/tmp/test.png'
    });

    expect(command).toBe('grim');
    expect(args).toEqual(['-g', '1,2 3x4', '/tmp/test.png']);
  });
});
