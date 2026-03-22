import { setTimeout as delay } from 'node:timers/promises';

import type {
  BackendContext,
  CapabilityState,
  WindowBackend,
  WindowInfo,
  WindowQuery
} from '../types.js';
import { runCommand, isCommandAvailable } from '../../utils/exec.js';
import { findBestTextMatch } from '../../utils/matching.js';

function parseWmctrlList(output: string): WindowInfo[] {
  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const match =
        line.match(
          /^([0-9a-fx]+)\s+(-?\d+)\s+(\S+)\s+(\S+)\s+(.*)$/
        ) ?? [];
      const [, id, workspace, , wmClass, title] = match;
      const [instanceName, className] = (wmClass ?? '').split('.', 2);
      return {
        id: id ?? '',
        workspace: workspace ? Number(workspace) : undefined,
        title: title ?? '',
        className,
        instanceName,
        visible: true,
        focused: false
      } satisfies WindowInfo;
    });
}

async function parseActiveWindow(timeoutMs: number): Promise<string | null> {
  try {
    const result = await runCommand('xdotool', ['getactivewindow'], { timeoutMs });
    const value = result.stdout.trim();
    if (!value) {
      return null;
    }
    return `0x${Number(value).toString(16)}`;
  } catch {
    return null;
  }
}

async function parseGeometry(windowId: string, timeoutMs: number) {
  try {
    const result = await runCommand('xwininfo', ['-id', windowId], { timeoutMs });
    const x = result.stdout.match(/Absolute upper-left X:\s+(\d+)/);
    const y = result.stdout.match(/Absolute upper-left Y:\s+(\d+)/);
    const width = result.stdout.match(/Width:\s+(\d+)/);
    const height = result.stdout.match(/Height:\s+(\d+)/);
    if (!x || !y || !width || !height) {
      return undefined;
    }
    return {
      x: Number(x[1]),
      y: Number(y[1]),
      width: Number(width[1]),
      height: Number(height[1])
    };
  } catch {
    return undefined;
  }
}

export async function detectWindowCapabilities(): Promise<CapabilityState> {
  const [wmctrl, xdotool] = await Promise.all([
    isCommandAvailable('wmctrl'),
    isCommandAvailable('xdotool')
  ]);

  return {
    name: 'windows',
    available: wmctrl || xdotool,
    details:
      wmctrl && xdotool
        ? 'Window enumeration and focus/move/resize supported via wmctrl and xdotool.'
        : wmctrl
          ? 'Window enumeration available via wmctrl; focus support may be partial.'
          : xdotool
            ? 'Focus support available via xdotool; window listing may be degraded.'
            : 'wmctrl and xdotool are unavailable.',
    dependencies: ['wmctrl', 'xdotool', 'xwininfo']
  };
}

export function createX11WindowBackend(context: BackendContext): WindowBackend {
  const timeoutMs = context.config.commandTimeoutMs;

  async function listWindows(): Promise<WindowInfo[]> {
    const wmctrl = await runCommand('wmctrl', ['-lx'], { timeoutMs });
    const windows = parseWmctrlList(wmctrl.stdout);
    const activeId = await parseActiveWindow(timeoutMs);

    return Promise.all(
      windows.map(async (window) => ({
        ...window,
        focused: activeId ? window.id.toLowerCase() === activeId.toLowerCase() : false,
        geometry: await parseGeometry(window.id, timeoutMs)
      }))
    );
  }

  async function resolveWindow(query: WindowQuery): Promise<WindowInfo> {
    const windows = await listWindows();

    if (query.id) {
      const byId = windows.find(
        (window) => window.id.toLowerCase() === query.id?.toLowerCase()
      );
      if (byId) {
        return byId;
      }
    }

    if (query.exactTitle) {
      const exact = windows.find((window) => window.title === query.exactTitle);
      if (exact) {
        return exact;
      }
    }

    if (query.title) {
      const match = findBestTextMatch(
        query.title,
        windows.map((window) => ({ value: window, text: window.title }))
      );
      if (match) {
        return match.value;
      }
    }

    throw new Error('Window not found');
  }

  return {
    name: 'x11-window',
    getCapability: detectWindowCapabilities,
    listWindows,
    async getActiveWindow() {
      const windows = await listWindows();
      return windows.find((window) => window.focused) ?? null;
    },
    async focusWindow(query) {
      const window = await resolveWindow(query);
      await runCommand('wmctrl', ['-ia', window.id], { timeoutMs });
      return window;
    },
    async moveWindow(windowId, x, y) {
      await runCommand('wmctrl', ['-ir', windowId, '-e', `0,${x},${y},-1,-1`], {
        timeoutMs
      });
    },
    async resizeWindow(windowId, width, height) {
      await runCommand(
        'wmctrl',
        ['-ir', windowId, '-e', `0,-1,-1,${width},${height}`],
        { timeoutMs }
      );
    },
    async closeWindow(windowId) {
      await runCommand('wmctrl', ['-ic', windowId], { timeoutMs });
    },
    async waitForWindow(query, waitTimeoutMs, intervalMs) {
      const startedAt = Date.now();
      while (Date.now() - startedAt < waitTimeoutMs) {
        try {
          return await resolveWindow(query);
        } catch {
          await delay(intervalMs);
        }
      }
      throw new Error('Timed out waiting for window');
    }
  };
}

export const internal = {
  parseWmctrlList
};
