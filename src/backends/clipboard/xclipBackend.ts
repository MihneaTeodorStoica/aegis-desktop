import type { BackendContext, CapabilityState, ClipboardBackend } from '../types.js';
import { isCommandAvailable, runCommand } from '../../utils/exec.js';

export function createClipboardBackend(context: BackendContext): ClipboardBackend {
  const timeoutMs = context.config.commandTimeoutMs;

  return {
    name: 'xclip',
    async getCapability(): Promise<CapabilityState> {
      const available = (await isCommandAvailable('xclip')) || (await isCommandAvailable('xsel'));
      return {
        name: 'clipboard',
        available,
        details: available
          ? 'Clipboard available via xclip or xsel.'
          : 'Clipboard support unavailable; install xclip or xsel.',
        dependencies: ['xclip', 'xsel']
      };
    },
    async readClipboard(): Promise<string> {
      if (await isCommandAvailable('xclip')) {
        const result = await runCommand('xclip', ['-o', '-selection', 'clipboard'], {
          timeoutMs
        });
        return result.stdout;
      }

      const result = await runCommand('xsel', ['--clipboard', '--output'], { timeoutMs });
      return result.stdout;
    },
    async writeClipboard(text: string): Promise<void> {
      if (await isCommandAvailable('xclip')) {
        await runCommand('sh', ['-c', `printf %s ${JSON.stringify(text)} | xclip -selection clipboard`], {
          timeoutMs
        });
        return;
      }

      await runCommand('sh', ['-c', `printf %s ${JSON.stringify(text)} | xsel --clipboard --input`], {
        timeoutMs
      });
    }
  };
}
