import { z } from 'zod';

import type { ServerContext } from '../../server/context.js';
import type { ToolDefinition } from '../types.js';

export function createAccessibilityTools(
  context: ServerContext
): Array<ToolDefinition<z.ZodTypeAny, unknown>> {
  return [
    {
      name: 'get_accessibility_tree',
      description:
        'Return an accessibility snapshot when AT-SPI support is available.',
      inputSchema: z.object({}).strict(),
      async execute() {
        return {
          nodes: await context.backends.accessibility.snapshotTree()
        };
      }
    },
    {
      name: 'find_semantic_targets',
      description:
        'Find accessibility nodes matching a semantic query when accessibility support is available.',
      inputSchema: z.object({
        query: z.string().min(1)
      }),
      async execute(input) {
        return {
          query: input.query,
          nodes: await context.backends.accessibility.findNodes(input.query)
        };
      }
    }
  ];
}
