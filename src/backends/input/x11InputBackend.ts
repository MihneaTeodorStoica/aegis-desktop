import type { BackendContext, CapabilityState, InputBackend } from '../types.js';
import { isCommandAvailable, runCommand } from '../../utils/exec.js';

const buttonMap = {
  left: 1,
  middle: 2,
  right: 3
} as const;

export async function detectInputCapabilities(): Promise<CapabilityState> {
  const xdotool = await isCommandAvailable('xdotool');
  return {
    name: 'input',
    available: xdotool,
    details: xdotool
      ? 'Mouse and keyboard automation available via xdotool.'
      : 'xdotool is unavailable.',
    dependencies: ['xdotool']
  };
}

export function createX11InputBackend(context: BackendContext): InputBackend {
  const timeoutMs = context.config.commandTimeoutMs;

  return {
    name: 'x11-input',
    getCapability: detectInputCapabilities,
    async keyDown(key) {
      await runCommand('xdotool', ['keydown', '--clearmodifiers', key], { timeoutMs });
    },
    async keyUp(key) {
      await runCommand('xdotool', ['keyup', '--clearmodifiers', key], { timeoutMs });
    },
    async mouseDown(button, x, y) {
      if (x !== undefined && y !== undefined) {
        await runCommand('xdotool', ['mousemove', String(x), String(y)], { timeoutMs });
      }
      await runCommand('xdotool', ['mousedown', String(buttonMap[button])], { timeoutMs });
    },
    async mouseUp(button, x, y) {
      if (x !== undefined && y !== undefined) {
        await runCommand('xdotool', ['mousemove', String(x), String(y)], { timeoutMs });
      }
      await runCommand('xdotool', ['mouseup', String(buttonMap[button])], { timeoutMs });
    },
    async mouseMove(x, y) {
      await runCommand('xdotool', ['mousemove', String(x), String(y)], { timeoutMs });
    },
    async mouseClick(button, count, x, y) {
      for (let index = 0; index < count; index += 1) {
        await this.mouseDown(button, x, y);
        await this.mouseUp(button);
      }
    },
    async mouseDrag(fromX, fromY, toX, toY, durationMs) {
      const frames = durationMs ? Math.max(Math.floor(durationMs / 16), 1) : 1;
      for (let frame = 1; frame <= frames; frame += 1) {
        const progress = frame / frames;
        const x = Math.round(fromX + (toX - fromX) * progress);
        const y = Math.round(fromY + (toY - fromY) * progress);
        await this.mouseMove(x, y);
      }
    },
    async typeText(text, delayMs, literal) {
      await runCommand(
        'xdotool',
        literal
          ? ['type', '--delay', String(delayMs), '--clearmodifiers', text]
          : ['type', '--delay', String(delayMs), text],
        { timeoutMs }
      );
    },
    async pressKeys(keys, mode) {
      if (mode === 'combo') {
        await runCommand('xdotool', ['key', '--clearmodifiers', keys.join('+')], {
          timeoutMs
        });
        return;
      }

      for (const key of keys) {
        await runCommand('xdotool', ['key', '--clearmodifiers', key], { timeoutMs });
      }
    },
    async getPointerPosition() {
      const result = await runCommand('xdotool', ['getmouselocation', '--shell'], {
        timeoutMs
      });
      const x = result.stdout.match(/X=(\d+)/);
      const y = result.stdout.match(/Y=(\d+)/);
      return {
        x: Number(x?.[1] ?? 0),
        y: Number(y?.[1] ?? 0)
      };
    },
    async getScreenSize() {
      const result = await runCommand('xdotool', ['getdisplaygeometry'], { timeoutMs });
      const [rawWidth, rawHeight] = result.stdout
        .trim()
        .split(/\s+/)
        .map((value) => Number(value));
      const width = rawWidth ?? 0;
      const height = rawHeight ?? 0;
      return {
        width: Number.isFinite(width) ? width : 0,
        height: Number.isFinite(height) ? height : 0
      };
    },
    async scroll(amount, direction) {
      const button = direction === 'up' ? '4' : '5';
      await runCommand(
        'xdotool',
        ['click', '--repeat', String(Math.max(amount, 1)), button],
        { timeoutMs }
      );
    }
  };
}
