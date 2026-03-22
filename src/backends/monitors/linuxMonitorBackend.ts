import type { BackendContext, CapabilityState, MonitorBackend, MonitorInfo } from '../types.js';
import { detectSessionType } from '../session.js';
import { isCommandAvailable, runCommand } from '../../utils/exec.js';

function parseXrandrMonitors(stdout: string): MonitorInfo[] {
  const monitors: MonitorInfo[] = [];
  for (const rawLine of stdout.split('\n').slice(1)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    const match = line.match(
      /^\d+:\s+([+*]*)([A-Za-z0-9_.-]+)\s+(\d+)\/\d+x(\d+)\/\d+\+(\d+)\+(\d+)/
    );
    if (!match) {
      continue;
    }
    const flags = match[1] ?? '';
    const name = match[2];
    const width = match[3];
    const height = match[4];
    const x = match[5];
    const y = match[6];
    if (!name || !width || !height || !x || !y) {
      continue;
    }
    monitors.push({
      id: name,
      name,
      width: Number(width),
      height: Number(height),
      x: Number(x),
      y: Number(y),
      primary: flags.includes('*'),
      active: true,
      scale: 1
    });
  }
  return monitors;
}

function parseWlrRandr(stdout: string): MonitorInfo[] {
  const monitors: MonitorInfo[] = [];
  const blocks = stdout.split(/\n(?=\S)/).map((block) => block.trim()).filter(Boolean);
  for (const block of blocks) {
    const lines = block.split('\n');
    const name = lines[0]?.trim();
    if (!name) {
      continue;
    }
    const current = block.match(/Current mode:\s+(\d+)x(\d+)/);
    const position = block.match(/Position:\s+(\d+),(\d+)/);
    const primary = /Primary:\s+yes/i.test(block);
    monitors.push({
      id: name,
      name,
      width: Number(current?.[1] ?? 0),
      height: Number(current?.[2] ?? 0),
      x: Number(position?.[1] ?? 0),
      y: Number(position?.[2] ?? 0),
      primary,
      active: true,
      scale: 1
    });
  }
  return monitors;
}

export async function detectMonitorCapabilities(): Promise<CapabilityState> {
  const sessionType = detectSessionType();
  const xrandr = await isCommandAvailable('xrandr');
  const wlrRandr = await isCommandAvailable('wlr-randr');

  return {
    name: 'monitors',
    available: xrandr || wlrRandr,
    details:
      sessionType === 'x11'
        ? xrandr
          ? 'Monitor enumeration available via xrandr.'
          : 'X11 session detected but xrandr is unavailable.'
        : sessionType === 'wayland'
          ? wlrRandr
            ? 'Wayland monitor enumeration available via wlr-randr.'
            : 'Wayland session detected; monitor enumeration requires wlr-randr.'
          : xrandr || wlrRandr
            ? 'Monitor enumeration available via installed tooling.'
            : 'No monitor enumeration backend available.',
    dependencies: ['xrandr', 'wlr-randr']
  };
}

export function createLinuxMonitorBackend(context: BackendContext): MonitorBackend {
  const timeoutMs = context.config.commandTimeoutMs;

  async function listMonitors(): Promise<MonitorInfo[]> {
    const sessionType = detectSessionType();
    const hasXrandr = await isCommandAvailable('xrandr');
    const hasWlrRandr = await isCommandAvailable('wlr-randr');

    if ((sessionType === 'x11' || sessionType === 'unknown') && hasXrandr) {
      const result = await runCommand('xrandr', ['--listmonitors'], { timeoutMs });
      return parseXrandrMonitors(result.stdout);
    }

    if ((sessionType === 'wayland' || sessionType === 'unknown') && hasWlrRandr) {
      const result = await runCommand('wlr-randr', [], { timeoutMs });
      return parseWlrRandr(result.stdout);
    }

    throw new Error(
      `No monitor backend available for current session (sessionType=${sessionType})`
    );
  }

  return {
    name: 'linux-monitors',
    getCapability: detectMonitorCapabilities,
    listMonitors,
    async getPrimaryMonitor() {
      const monitors = await listMonitors();
      return monitors.find((monitor) => monitor.primary) ?? monitors[0] ?? null;
    },
    async getVirtualScreen() {
      const monitors = await listMonitors();
      const width = monitors.reduce(
        (max, monitor) => Math.max(max, monitor.x + monitor.width),
        0
      );
      const height = monitors.reduce(
        (max, monitor) => Math.max(max, monitor.y + monitor.height),
        0
      );
      return { width, height };
    }
  };
}

export const monitorParsers = {
  parseXrandrMonitors,
  parseWlrRandr
};
