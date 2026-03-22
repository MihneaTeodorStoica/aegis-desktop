import { describe, expect, it } from 'vitest';

import { defaultConfig } from '../src/config/defaults.js';
import { PolicyEngine } from '../src/policy/policy.js';

describe('PolicyEngine', () => {
  it('blocks disabled tools', () => {
    const engine = new PolicyEngine({
      ...defaultConfig,
      allowedLaunchCommands: [...defaultConfig.allowedLaunchCommands],
      envAllowlist: [...defaultConfig.envAllowlist],
      disabledTools: ['mouse_click']
    });

    expect(() => engine.assertToolEnabled({ toolName: 'mouse_click' })).toThrow();
  });

  it('enforces launch allowlist', () => {
    const engine = new PolicyEngine({
      ...defaultConfig,
      allowedLaunchCommands: [...defaultConfig.allowedLaunchCommands],
      envAllowlist: [...defaultConfig.envAllowlist],
      disabledTools: []
    });

    expect(() =>
      engine.assertLaunchAllowed({
        command: 'rm'
      })
    ).toThrow();
  });
});
