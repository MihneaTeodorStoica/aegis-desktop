import { z } from 'zod';

import type { ServerContext } from '../../server/context.js';
import type { ToolDefinition } from '../types.js';

export function createMonitorTools(
  context: ServerContext
): Array<ToolDefinition<z.ZodTypeAny, unknown>> {
  return [
    {
      name: 'list_monitors',
      description: 'List detected monitors and their geometry.',
      inputSchema: z.object({}).strict(),
      async execute() {
        return {
          monitors: await context.backends.monitor.listMonitors()
        };
      }
    }
  ];
}
