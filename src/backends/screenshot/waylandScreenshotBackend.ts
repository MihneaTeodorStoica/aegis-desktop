import { stat } from 'node:fs/promises';

import type {
  BackendContext,
  CapabilityState,
  ScreenshotBackend,
  ScreenshotOptions,
  ScreenshotResult
} from '../types.js';
import { isCommandAvailable, runCommand } from '../../utils/exec.js';
import { readPngMetadata } from '../../utils/png.js';

export async function detectWaylandScreenshotCapabilities(): Promise<CapabilityState> {
  const grim = await isCommandAvailable('grim');
  const gnome = await isCommandAvailable('gnome-screenshot');
  return {
    name: 'screenshot',
    available: grim || gnome,
    details: grim
      ? 'Wayland screenshots available via grim.'
      : gnome
        ? 'Wayland screenshots available via gnome-screenshot with limited deterministic region support.'
        : 'No Wayland screenshot backend available; install grim or gnome-screenshot.',
    dependencies: ['grim', 'gnome-screenshot']
  };
}

export function buildWaylandScreenshotCommand(
  backend: 'grim' | 'gnome-screenshot',
  options: ScreenshotOptions
): [string, string[]] {
  if (backend === 'grim') {
    const args =
      options.mode === 'region' && options.region
        ? [
            '-g',
            `${options.region.x},${options.region.y} ${options.region.width}x${options.region.height}`,
            options.outputPath
          ]
        : [options.outputPath];
    if (options.mode === 'active-window') {
      throw new Error(
        'Active-window screenshot is not portable on Wayland in v1; use fullscreen or region.'
      );
    }
    return ['grim', args];
  }

  if (options.mode === 'region') {
    throw new Error(
      'Deterministic region screenshots are not supported with gnome-screenshot on Wayland in v1.'
    );
  }
  return ['gnome-screenshot', ['--file', options.outputPath]];
}

export function createWaylandScreenshotBackend(
  context: BackendContext
): ScreenshotBackend {
  const timeoutMs = context.config.commandTimeoutMs;

  return {
    name: 'wayland-screenshot',
    getCapability: detectWaylandScreenshotCapabilities,
    async takeScreenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
      if (await isCommandAvailable('grim')) {
        const [command, args] = buildWaylandScreenshotCommand('grim', options);
        await runCommand(command, args, { timeoutMs });
      } else if (await isCommandAvailable('gnome-screenshot')) {
        const [command, args] = buildWaylandScreenshotCommand(
          'gnome-screenshot',
          options
        );
        await runCommand(command, args, { timeoutMs });
      } else {
        throw new Error('No Wayland screenshot backend available');
      }

      const file = await stat(options.outputPath);
      const metadata = await readPngMetadata(options.outputPath);
      return {
        path: options.outputPath,
        mimeType: 'image/png',
        sizeBytes: file.size,
        width: metadata?.width,
        height: metadata?.height,
        backend: this.name
      };
    }
  };
}
