import { z } from 'zod';

import type { ToolDefinition } from '../types.js';
import type { ServerContext } from '../../server/context.js';
import { requireToolEnabled } from '../../policy/checks.js';

const windowQueryBaseSchema = z.object({
  id: z.string().min(1).optional(),
  exactTitle: z.string().min(1).optional(),
  title: z.string().min(1).optional()
});

const windowQuerySchema = windowQueryBaseSchema.refine(
  (value) => Boolean(value.id || value.exactTitle || value.title),
  {
    message: 'Provide id, exactTitle, or title'
  }
);

export function createWindowTools(context: ServerContext): Array<ToolDefinition<z.ZodTypeAny, unknown>> {
  return [
    {
      name: 'list_windows',
      description: 'List visible top-level windows with metadata and geometry when available.',
      inputSchema: z.object({}).strict(),
      async execute() {
        return { windows: await context.backends.window.listWindows() };
      }
    },
    {
      name: 'get_active_window',
      description: 'Return metadata for the currently focused window.',
      inputSchema: z.object({}).strict(),
      async execute() {
        return { window: await context.backends.window.getActiveWindow() };
      }
    },
    {
      name: 'focus_window',
      description: 'Focus a window by id, exact title, or best-match title.',
      inputSchema: windowQuerySchema,
      async execute(input) {
        requireToolEnabled(context.policy, 'focus_window');
        return { window: await context.backends.window.focusWindow(input) };
      }
    },
    {
      name: 'move_window',
      description: 'Move a window to absolute x and y coordinates.',
      inputSchema: z.object({
        windowId: z.string().min(1),
        x: z.number().int().min(0),
        y: z.number().int().min(0)
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'move_window');
        context.policy.assertCoordinates(input.x, input.y);
        await context.backends.window.moveWindow(input.windowId, input.x, input.y);
        return { ok: true };
      }
    },
    {
      name: 'resize_window',
      description: 'Resize a window to the specified width and height.',
      inputSchema: z.object({
        windowId: z.string().min(1),
        width: z.number().int().positive(),
        height: z.number().int().positive()
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'resize_window');
        await context.backends.window.resizeWindow(
          input.windowId,
          input.width,
          input.height
        );
        return { ok: true };
      }
    },
    {
      name: 'set_window_bounds',
      description: 'Move and resize a window in one operation.',
      inputSchema: z.object({
        windowId: z.string().min(1),
        x: z.number().int().min(0),
        y: z.number().int().min(0),
        width: z.number().int().positive(),
        height: z.number().int().positive()
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'set_window_bounds');
        await context.backends.window.moveWindow(input.windowId, input.x, input.y);
        await context.backends.window.resizeWindow(
          input.windowId,
          input.width,
          input.height
        );
        return { ok: true };
      }
    },
    {
      name: 'close_window',
      description: 'Request a polite close for the specified window.',
      inputSchema: z.object({
        windowId: z.string().min(1)
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'close_window');
        await context.backends.window.closeWindow(input.windowId);
        return { ok: true, semantics: 'polite_request' };
      }
    },
    {
      name: 'wait_for_window',
      description: 'Poll until a matching window appears or the timeout expires.',
      inputSchema: windowQueryBaseSchema.extend({
        timeoutMs: z.number().int().positive().default(5000),
        intervalMs: z.number().int().positive().default(250)
      }).refine((value) => Boolean(value.id || value.exactTitle || value.title), {
        message: 'Provide id, exactTitle, or title'
      }),
      async execute(input) {
        return {
          window: await context.backends.window.waitForWindow(
            input,
            input.timeoutMs,
            input.intervalMs
          )
        };
      }
    },
    {
      name: 'move_window_to_primary_monitor',
      description: 'Move a window to the origin of the primary monitor.',
      inputSchema: z.object({
        windowId: z.string().min(1)
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'move_window_to_primary_monitor');
        await context.backends.window.moveWindow(input.windowId, 0, 0);
        return { ok: true };
      }
    }
  ];
}
