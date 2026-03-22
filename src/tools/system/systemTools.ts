import { z } from 'zod';

import type { ToolDefinition } from '../types.js';
import type { ServerContext } from '../../server/context.js';

export function createSystemTools(context: ServerContext): Array<ToolDefinition<z.ZodTypeAny, unknown>> {
  return [
    {
      name: 'get_system_info',
      description:
        'Return OS, session, hostname, version, backend availability, and detected binaries.',
      inputSchema: z.object({}).strict(),
      async execute() {
        return {
          version: '0.1.0',
          ...context.backends.systemInfo,
          capabilities: context.backends.capabilities,
          monitors: await context.backends.monitor.listMonitors().catch(() => [])
        };
      }
    },
    {
      name: 'get_desktop_snapshot',
      description: 'Return a cheap structured desktop snapshot without taking a screenshot.',
      inputSchema: z.object({
        window_limit: z.number().int().min(0).optional()
      }),
      async execute(input) {
        const pointer = await context.backends.input.getPointerPosition().catch(() => null);
        const activeWindow = await context.backends.window.getActiveWindow().catch(() => null);
        const windows = await context.backends.window.listWindows().catch(() => []);
        const ordered = windows.sort((left, right) => {
          const leftFocused = left.focused ? 0 : 1;
          const rightFocused = right.focused ? 0 : 1;
          const leftVisible = left.visible === false ? 1 : 0;
          const rightVisible = right.visible === false ? 1 : 0;
          return (
            leftFocused - rightFocused ||
            leftVisible - rightVisible ||
            left.title.localeCompare(right.title)
          );
        });
        const limit = input.window_limit ?? 8;

        return {
          mouse_position: pointer,
          active_window: activeWindow,
          visible_windows: ordered.slice(0, Math.max(limit, 0)),
          visible_window_count: windows.length
        };
      }
    },
    {
      name: 'list_capabilities',
      description: 'Return detected capability status for each backend and integration.',
      inputSchema: z.object({}).strict(),
      async execute() {
        return {
          capabilities: context.backends.capabilities
        };
      }
    },
    {
      name: 'health_check',
      description: 'Return readiness, session details, and backend diagnostics.',
      inputSchema: z.object({}).strict(),
      async execute() {
        const capabilities = context.backends.capabilities;
        return {
          ready: capabilities.some((capability) => capability.available),
          sessionType: context.backends.systemInfo.sessionType,
          diagnostics: capabilities
        };
      }
    }
  ];
}
