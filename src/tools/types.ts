import type { z } from 'zod';

export interface ToolDefinition<TSchema extends z.ZodTypeAny, TResult> {
  name: string;
  description: string;
  inputSchema: TSchema;
  execute(input: z.infer<TSchema>): Promise<TResult>;
}
