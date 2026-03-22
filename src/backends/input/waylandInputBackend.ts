import type { BackendContext, CapabilityState, InputBackend } from '../types.js';
import { isCommandAvailable, runCommand } from '../../utils/exec.js';

async function unsupportedCapability(): Promise<CapabilityState> {
  const ydotool = await isCommandAvailable('ydotool');
  return {
    name: 'input',
    available: ydotool,
    details: ydotool
      ? 'Partial Wayland input support available via ydotool. Key and mouse synthesis may require elevated daemon setup.'
      : 'Wayland input automation is unavailable in v1 unless ydotool is installed and configured.',
    dependencies: ['ydotool']
  };
}

export function createWaylandInputBackend(context: BackendContext): InputBackend {
  const timeoutMs = context.config.commandTimeoutMs;

  async function ensureYdotool(): Promise<void> {
    if (!(await isCommandAvailable('ydotool'))) {
      throw new Error('Wayland input backend requires ydotool');
    }
  }

  async function runYdotool(args: string[]): Promise<void> {
    await ensureYdotool();
    await runCommand('ydotool', args, { timeoutMs });
  }

  return {
    name: 'wayland-input',
    getCapability: unsupportedCapability,
    async keyDown(key) {
      void key;
      throw new Error('Wayland key_down is not yet mapped in v1; use capability checks.');
    },
    async keyUp(key) {
      void key;
      throw new Error('Wayland key_up is not yet mapped in v1; use capability checks.');
    },
    async mouseDown(button, x, y) {
      void button;
      void x;
      void y;
      throw new Error('Wayland mouse_down is not yet mapped in v1; use capability checks.');
    },
    async mouseUp(button, x, y) {
      void button;
      void x;
      void y;
      throw new Error('Wayland mouse_up is not yet mapped in v1; use capability checks.');
    },
    async mouseMove(x, y) {
      await runYdotool(['mousemove', '--absolute', String(x), String(y)]);
    },
    async mouseClick(button, count, x, y) {
      void button;
      void count;
      void x;
      void y;
      throw new Error('Wayland mouse_click is not yet mapped in v1; use capability checks.');
    },
    async mouseDrag(fromX, fromY, toX, toY, durationMs) {
      void fromX;
      void fromY;
      void toX;
      void toY;
      void durationMs;
      throw new Error('Wayland mouse_drag is not yet mapped in v1; use capability checks.');
    },
    async typeText(text, delayMs, literal) {
      void delayMs;
      void literal;
      await runYdotool(['type', text]);
    },
    async pressKeys(keys, mode) {
      void keys;
      void mode;
      throw new Error('Wayland press_keys is not yet mapped in v1; use capability checks.');
    },
    async getPointerPosition() {
      throw new Error('Wayland pointer position introspection is not implemented in v1.');
    },
    async getScreenSize() {
      throw new Error('Wayland screen size introspection should be read from monitor backend.');
    },
    async scroll(amount, direction) {
      void amount;
      void direction;
      throw new Error('Wayland scroll is not yet mapped in v1; use capability checks.');
    }
  };
}
