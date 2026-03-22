import { z } from 'zod';

import type { ToolDefinition } from '../types.js';
import type { ServerContext } from '../../server/context.js';
import { requireToolEnabled } from '../../policy/checks.js';

export function createAppTools(context: ServerContext): Array<ToolDefinition<z.ZodTypeAny, unknown>> {
  return [
    {
      name: 'launch_app',
      description: 'Launch an application from a command and argument list.',
      inputSchema: z.object({
        command: z.string().min(1),
        args: z.array(z.string()).default([]),
        cwd: z.string().min(1).optional(),
        env: z.record(z.string()).optional()
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'launch_app');
        context.policy.assertLaunchAllowed({
          command: input.command,
          env: input.env
        });
        return await context.backends.launch.launchApp(input);
      }
    },
    {
      name: 'open_url',
      description: 'Open a URL through the system URL handler.',
      inputSchema: z.object({
        url: z.string().url()
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'open_url');
        await context.backends.launch.openUrl(input.url);
        return { ok: true };
      }
    }
  ];
}
