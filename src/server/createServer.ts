import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { normalizeError } from './errors.js';
import { getToolDefinitions } from './registerTools.js';
import type { ServerContext } from './context.js';

function asTextResult(payload: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(payload, null, 2)
      }
    ]
  };
}

export async function createServer(context: ServerContext): Promise<Server> {
  const server = new Server(
    {
      name: 'aegis-desktop',
      version: '0.1.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  const tools = getToolDefinitions(context);
  const toolMap = new Map(tools.map((tool) => [tool.name, tool]));

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = toolMap.get(request.params.name);
    if (!tool) {
      return {
        ...asTextResult({
          error: {
            code: 'TOOL_NOT_FOUND',
            message: `Unknown tool: ${request.params.name}`
          }
        }),
        isError: true
      };
    }

    try {
      const parsed = tool.inputSchema.parse(request.params.arguments ?? {});
      const result = await tool.execute(parsed);
      return asTextResult(result);
    } catch (error) {
      context.logger.error('Tool execution failed', {
        tool: request.params.name,
        error: normalizeError(error)
      });
      return {
        ...asTextResult({ error: normalizeError(error) }),
        isError: true
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  return server;
}
