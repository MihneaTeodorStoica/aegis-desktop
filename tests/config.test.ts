import { describe, expect, it, vi } from 'vitest';

import { loadConfig } from '../src/config/env.js';

describe('loadConfig', () => {
  it('loads defaults from environment', async () => {
    vi.stubEnv('AEGIS_OCR_ENABLED', 'false');
    vi.stubEnv('AEGIS_ALLOWED_LAUNCH_COMMANDS', 'firefox,code');

    const config = await loadConfig();

    expect(config.ocrEnabled).toBe(false);
    expect(config.allowedLaunchCommands).toEqual(['firefox', 'code']);

    vi.unstubAllEnvs();
  });
});
