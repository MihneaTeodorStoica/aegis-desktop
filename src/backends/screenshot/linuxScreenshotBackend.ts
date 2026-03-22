import { stat } from 'node:fs/promises';

import type {
  BackendContext,
  CapabilityState,
  ScreenshotBackend,
  ScreenshotOptions,
  ScreenshotResult
} from '../types.js';
import type { AppConfig } from '../../config/schema.js';
import { isCommandAvailable, runCommand } from '../../utils/exec.js';

type ScreenshotCommand = 'maim' | 'import' | 'gnome-screenshot' | null;

async function pickScreenshotCommand(config: AppConfig): Promise<ScreenshotCommand> {
  if (config.screenshotBackend !== 'auto') {
    return (await isCommandAvailable(config.screenshotBackend))
      ? config.screenshotBackend
      : null;
  }

  for (const candidate of ['maim', 'import', 'gnome-screenshot'] as const) {
    if (await isCommandAvailable(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function detectScreenshotCapabilities(
  config: AppConfig
): Promise<CapabilityState> {
  const selected = await pickScreenshotCommand(config);
  return {
    name: 'screenshot',
    available: selected !== null,
    details: selected
      ? `Screenshot capture available via ${selected}.`
      : 'No supported screenshot binary detected (maim, import, gnome-screenshot).',
    dependencies: ['maim', 'import', 'gnome-screenshot']
  };
}

export function createLinuxScreenshotBackend(
  context: BackendContext
): ScreenshotBackend {
  const timeoutMs = context.config.commandTimeoutMs;

  async function buildCommand(options: ScreenshotOptions): Promise<[string, string[]]> {
    const selected = await pickScreenshotCommand(context.config);
    if (!selected) {
      throw new Error('No screenshot backend available');
    }

    if (selected === 'maim') {
      if (options.mode === 'region' && options.region) {
        return [
          'maim',
          [
            '-g',
            `${options.region.width}x${options.region.height}+${options.region.x}+${options.region.y}`,
            options.outputPath
          ]
        ];
      }
      if (options.mode === 'active-window') {
        return ['maim', ['-i', '$(xdotool getactivewindow)', options.outputPath]];
      }
      return ['maim', [options.outputPath]];
    }

    if (selected === 'import') {
      if (options.mode === 'region' && options.region) {
        return [
          'import',
          [
            '-window',
            'root',
            '-crop',
            `${options.region.width}x${options.region.height}+${options.region.x}+${options.region.y}`,
            options.outputPath
          ]
        ];
      }
      return ['import', ['-window', 'root', options.outputPath]];
    }

    if (options.mode === 'region' && options.region) {
      return [
        'gnome-screenshot',
        [
          '--file',
          options.outputPath,
          '--area',
          `--border-effect=none`
        ]
      ];
    }

    if (options.mode === 'active-window') {
      return ['gnome-screenshot', ['--window', '--file', options.outputPath]];
    }

    return ['gnome-screenshot', ['--file', options.outputPath]];
  }

  return {
    name: 'linux-screenshot',
    getCapability: () => detectScreenshotCapabilities(context.config),
    async takeScreenshot(options) {
      const [command, args] = await buildCommand(options);
      if (command === 'maim' && args[0] === '-i' && args[1]?.startsWith('$(')) {
        const active = await runCommand('xdotool', ['getactivewindow'], { timeoutMs });
        args[1] = active.stdout.trim();
      }
      await runCommand(command, args, { timeoutMs });
      const file = await stat(options.outputPath);
      return {
        path: options.outputPath,
        mimeType: 'image/png',
        sizeBytes: file.size,
        backend: command
      } satisfies ScreenshotResult;
    }
  };
}
