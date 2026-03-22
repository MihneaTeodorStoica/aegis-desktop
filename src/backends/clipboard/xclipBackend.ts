import type { BackendContext, CapabilityState, ClipboardBackend } from '../types.js';
import {
  isCommandAvailable,
  runCommand,
  runCommandWithInput
} from '../../utils/exec.js';
import { detectSessionType } from '../session.js';

export function createClipboardBackend(context: BackendContext): ClipboardBackend {
  const timeoutMs = context.config.commandTimeoutMs;

  return {
    name: 'xclip',
    async getCapability(): Promise<CapabilityState> {
      const sessionType = detectSessionType();
      const available =
        (await isCommandAvailable('wl-copy')) ||
        (await isCommandAvailable('wl-paste')) ||
        (await isCommandAvailable('xclip')) ||
        (await isCommandAvailable('xsel'));
      return {
        name: 'clipboard',
        available,
        details: available
          ? sessionType === 'wayland'
            ? 'Clipboard available via wl-copy/wl-paste or X11 fallback tools.'
            : 'Clipboard available via xclip/xsel or wl-copy/wl-paste.'
          : 'Clipboard support unavailable; install wl-copy/wl-paste, xclip, or xsel.',
        dependencies: ['wl-copy', 'wl-paste', 'xclip', 'xsel']
      };
    },
    async readClipboard(): Promise<string> {
      if (detectSessionType() === 'wayland' && (await isCommandAvailable('wl-paste'))) {
        const result = await runCommand('wl-paste', ['--no-newline'], {
          timeoutMs
        });
        return result.stdout;
      }
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
      if (detectSessionType() === 'wayland' && (await isCommandAvailable('wl-copy'))) {
        await runCommandWithInput('wl-copy', [], text, { timeoutMs });
        return;
      }
      if (await isCommandAvailable('xclip')) {
        await runCommandWithInput('xclip', ['-selection', 'clipboard'], text, {
          timeoutMs
        });
        return;
      }

      await runCommandWithInput('xsel', ['--clipboard', '--input'], text, {
        timeoutMs
      });
    }
  };
}
