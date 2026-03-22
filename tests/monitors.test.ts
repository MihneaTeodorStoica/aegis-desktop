import { describe, expect, it } from 'vitest';

import { monitorParsers } from '../src/backends/monitors/linuxMonitorBackend.js';
import { resolvePointTarget } from '../src/utils/coordinates.js';

describe('monitor parsers', () => {
  it('parses xrandr monitor output', () => {
    const monitors = monitorParsers.parseXrandrMonitors(
      'Monitors: 2\n 0: +*eDP-1 1920/309x1080/174+0+0  eDP-1\n 1: +HDMI-1 2560/597x1440/336+1920+0  HDMI-1\n'
    );

    expect(monitors).toHaveLength(2);
    expect(monitors[0]?.id).toBe('eDP-1');
    expect(monitors[0]?.primary).toBe(true);
    expect(monitors[1]?.x).toBe(1920);
  });
});

describe('coordinate routing', () => {
  const monitors = [
    {
      id: 'eDP-1',
      name: 'eDP-1',
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      primary: true,
      active: true
    }
  ];

  it('routes monitor-relative coordinates', () => {
    const point = resolvePointTarget(
      {
        monitorId: 'eDP-1',
        relativeX: 100,
        relativeY: 50
      },
      monitors
    );

    expect(point).toEqual({
      x: 100,
      y: 50,
      monitor: monitors[0]
    });
  });
});
