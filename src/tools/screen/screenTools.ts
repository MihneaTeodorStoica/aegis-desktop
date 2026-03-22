import { readdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { z } from 'zod';

import type { ToolDefinition } from '../types.js';
import type { ServerContext } from '../../server/context.js';
import { ensureDir } from '../../utils/paths.js';
import { requireToolEnabled } from '../../policy/checks.js';
import { resolvePointTarget } from '../../utils/coordinates.js';
import { buildWindowVisualFrame, resolveWindowQuery } from '../../utils/windowTargets.js';

function artifactName(prefix: string): string {
  const stamp = new Date().toISOString().replaceAll(':', '-');
  return `${prefix}-${stamp}.png`;
}

export function createScreenTools(context: ServerContext): Array<ToolDefinition<z.ZodTypeAny, unknown>> {
  const windowQuerySchema = z
    .object({
      id: z.string().min(1).optional(),
      exactTitle: z.string().min(1).optional(),
      title: z.string().min(1).optional(),
      activate: z.boolean().default(true)
    })
    .strict();

  const regionSchema = z
    .object({
      x: z.number().int().min(0).optional(),
      y: z.number().int().min(0).optional(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      monitorId: z.string().min(1).optional(),
      relativeX: z.number().int().min(0).optional(),
      relativeY: z.number().int().min(0).optional()
    })
    .refine(
      (value) =>
        (value.x === undefined && value.y === undefined) ||
        (value.x !== undefined && value.y !== undefined),
      { message: 'Absolute region coordinates require both x and y' }
    )
    .refine(
      (value) =>
        (value.monitorId === undefined &&
          value.relativeX === undefined &&
          value.relativeY === undefined) ||
        (value.monitorId !== undefined &&
          value.relativeX !== undefined &&
          value.relativeY !== undefined),
      { message: 'Relative region coordinates require monitorId, relativeX, and relativeY' }
    );

  async function resolveRegion(
    region:
      | {
          x?: number;
          y?: number;
          width: number;
          height: number;
          monitorId?: string;
          relativeX?: number;
          relativeY?: number;
        }
      | undefined
  ) {
    if (!region) {
      return undefined;
    }
    if (region.x !== undefined || region.y !== undefined) {
      return {
        x: region.x ?? 0,
        y: region.y ?? 0,
        width: region.width,
        height: region.height
      };
    }
    if (region.monitorId !== undefined) {
      const point = resolvePointTarget(
        {
          monitorId: region.monitorId,
          relativeX: region.relativeX,
          relativeY: region.relativeY
        },
        await context.backends.monitor.listMonitors()
      );
      if (!point) {
        return undefined;
      }
      return {
        x: point.x,
        y: point.y,
        width: region.width,
        height: region.height
      };
    }
    return undefined;
  }

  async function inspectScreen(
    input: {
      mode: 'fullscreen' | 'active-window' | 'region';
      region?: {
        x?: number;
        y?: number;
        width: number;
        height: number;
        monitorId?: string;
        relativeX?: number;
        relativeY?: number;
      };
      ocr: boolean;
    }
  ) {
    const region = await resolveRegion(input.region);
    requireToolEnabled(context.policy, 'inspect_screen');
    context.policy.assertScreenshotAllowed({ region });
    const dir = await ensureDir(context.config.artifactDir);
    const path = join(dir, artifactName('inspect'));
    const screenshot = await context.backends.screenshot.takeScreenshot({
      mode: input.mode,
      region,
      outputPath: path
    });

    let ocr: { text: string; backend: string } | null = null;
    if (input.ocr) {
      try {
        ocr = await context.backends.ocr.extractText(path);
      } catch (error) {
        context.logger.warn('OCR unavailable during inspect_screen', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return {
      screenshot,
      ocr
    };
  }

  async function resolveWindowTarget(
    input: z.infer<typeof windowQuerySchema>
  ) {
    const activeWindow = await context.backends.window.getActiveWindow().catch(() => null);
    const windows = await context.backends.window.listWindows().catch(() => []);
    let window = resolveWindowQuery(input, windows, activeWindow);
    if (input.activate && !window.focused) {
      window = await context.backends.window.focusWindow({ id: window.id });
    }
    return window;
  }

  return [
    {
      name: 'take_screenshot',
      description: 'Capture a full screen, active window, or explicit region screenshot.',
      inputSchema: z.object({
        mode: z.enum(['fullscreen', 'active-window', 'region']).default('fullscreen'),
        region: regionSchema.optional()
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'take_screenshot');
        const region = await resolveRegion(input.region);
        context.policy.assertScreenshotAllowed({ region });
        const dir = await ensureDir(context.config.artifactDir);
        const path = join(dir, artifactName('screenshot'));
        const result = await context.backends.screenshot.takeScreenshot({
          mode: input.mode,
          region,
          outputPath: path
        });
        return result;
      }
    },
    {
      name: 'window_screenshot',
      description: 'Capture the active window to an artifact file.',
      inputSchema: windowQuerySchema.partial(),
      async execute(input) {
        requireToolEnabled(context.policy, 'window_screenshot');
        context.policy.assertScreenshotAllowed({});
        const window =
          input.id || input.exactTitle || input.title
            ? await resolveWindowTarget({
                id: input.id,
                exactTitle: input.exactTitle,
                title: input.title,
                activate: input.activate ?? true
              })
            : await context.backends.window.getActiveWindow().catch(() => null);
        const dir = await ensureDir(context.config.artifactDir);
        const path = join(dir, artifactName('window'));
        const screenshot = await context.backends.screenshot.takeScreenshot({
          mode: 'active-window',
          outputPath: path
        });
        return {
          ...screenshot,
          window,
          visual_frame: window ? buildWindowVisualFrame(window) : null
        };
      }
    },
    {
      name: 'inspect_screen',
      description: 'Capture a screenshot and optionally run OCR when available.',
      inputSchema: z.object({
        mode: z.enum(['fullscreen', 'active-window', 'region']).default('fullscreen'),
        region: regionSchema.optional(),
        ocr: z.boolean().default(true)
      }),
      async execute(input) {
        return inspectScreen(input);
      }
    },
    {
      name: 'find_text_on_screen',
      description: 'Capture the screen, OCR it, and report whether the query text is present.',
      inputSchema: z.object({
        query: z.string().min(1),
        mode: z.enum(['fullscreen', 'active-window', 'region']).default('fullscreen')
      }),
      async execute(input) {
        const response = await inspectScreen({
          mode: input.mode,
          ocr: true
        });
        const typed = response as { screenshot: unknown; ocr: { text: string } | null };
        const text = typed.ocr?.text ?? '';
        return {
          screenshot: typed.screenshot,
          query: input.query,
          found: text.toLowerCase().includes(input.query.toLowerCase()),
          text
        };
      }
    },
    {
      name: 'artifact_list',
      description: 'List generated artifacts stored in the configured artifact directory.',
      inputSchema: z.object({}).strict(),
      async execute() {
        const dir = await ensureDir(context.config.artifactDir);
        const entries = await readdir(dir, { withFileTypes: true });
        const artifacts = entries
          .filter((entry) => entry.isFile())
          .map((entry) => ({
            name: basename(entry.name),
            path: join(dir, entry.name),
            extension: extname(entry.name)
          }));

        return { artifactDir: dir, artifacts };
      }
    }
  ];
}
