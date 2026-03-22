import { spawn } from 'node:child_process';

import type { CapabilityState, LaunchBackend, LaunchOptions, LaunchResult } from '../types.js';
import { isCommandAvailable } from '../../utils/exec.js';

export function createLinuxLauncher(): LaunchBackend {
  return {
    name: 'linux-launch',
    async getCapability(): Promise<CapabilityState> {
      const available = await isCommandAvailable('xdg-open');
      return {
        name: 'launch',
        available: true,
        details: available
          ? 'App launching available via spawn and URL opening via xdg-open.'
          : 'App launching available via spawn; xdg-open is unavailable for open_url.',
        dependencies: ['xdg-open']
      };
    },
    async launchApp(options: LaunchOptions): Promise<LaunchResult> {
      const child = spawn(options.command, options.args, {
        cwd: options.cwd,
        env: {
          ...process.env,
          ...options.env
        },
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      return {
        pid: child.pid ?? null,
        command: options.command,
        args: options.args
      };
    },
    async openUrl(url: string): Promise<void> {
      const child = spawn('xdg-open', [url], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
    }
  };
}
