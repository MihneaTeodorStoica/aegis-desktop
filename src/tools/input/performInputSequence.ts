import type { InputBackend } from '../../backends/types.js';
import { executeInputSequence } from '../../input-sequence/execute.js';
import { normalizeInputSequence } from '../../input-sequence/normalize.js';
import { performInputSequenceSchema } from '../../input-sequence/schema.js';
import type { ServerContext } from '../../server/context.js';
import { requireToolEnabled } from '../../policy/checks.js';
import type { ToolDefinition } from '../types.js';

async function getScreenSizeSafe(backend: InputBackend) {
  try {
    return await backend.getScreenSize();
  } catch {
    return undefined;
  }
}

export function createPerformInputSequenceTool(
  context: ServerContext
): ToolDefinition<typeof performInputSequenceSchema, unknown> {
  return {
    name: 'perform_input_sequence',
    description:
      'Execute a validated ordered sequence of low-level keyboard and mouse events as one logical action.',
    inputSchema: performInputSequenceSchema,
    async execute(input) {
      requireToolEnabled(context.policy, 'perform_input_sequence');
      const screenSize = await getScreenSizeSafe(context.backends.input);
      const normalized = normalizeInputSequence(input.steps, {
        defaultDelayMs: input.default_delay_ms,
        clampToScreen: input.clamp_to_screen,
        maxSteps: context.config.maxInputSequenceSteps,
        screenSize
      });

      return executeInputSequence(
        context.backends.input,
        normalized.steps,
        normalized.warnings,
        {
          abortOnError: input.abort_on_error,
          cleanupStuckInputs: input.cleanup_stuck_inputs,
          dryRun: input.dry_run
        }
      );
    }
  };
}
