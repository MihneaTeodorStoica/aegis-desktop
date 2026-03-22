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
          capabilities: context.backends.capabilities
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
