import { z } from 'zod';

import type { ToolDefinition } from '../types.js';
import type { ServerContext } from '../../server/context.js';
import { requireToolEnabled } from '../../policy/checks.js';

export function createClipboardTools(
  context: ServerContext
): Array<ToolDefinition<z.ZodTypeAny, unknown>> {
  return [
    {
      name: 'read_clipboard',
      description: 'Read the current clipboard contents if supported.',
      inputSchema: z.object({}).strict(),
      async execute() {
        return { text: await context.backends.clipboard.readClipboard() };
      }
    },
    {
      name: 'write_clipboard',
      description: 'Write text to the clipboard if supported.',
      inputSchema: z.object({
        text: z.string()
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'write_clipboard');
        await context.backends.clipboard.writeClipboard(input.text);
        return { ok: true };
      }
    }
  ];
}
