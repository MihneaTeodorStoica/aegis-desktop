import { setTimeout as delay } from 'node:timers/promises';

import type { InputBackend } from '../backends/types.js';
import type {
  CleanupActionResult,
  ExecutionState,
  NormalizedSequenceStep,
  SequenceExecutionResult,
  SequenceWarning
} from './types.js';

export interface ExecuteSequenceOptions {
  abortOnError: boolean;
  cleanupStuckInputs: boolean;
  dryRun: boolean;
}

async function applyStep(
  backend: InputBackend,
  state: ExecutionState,
  step: NormalizedSequenceStep
): Promise<void> {
  switch (step.type) {
    case 'key_down':
      await backend.keyDown(step.key);
      state.heldKeys.add(step.key);
      return;
    case 'key_up':
      await backend.keyUp(step.key);
      state.heldKeys.delete(step.key);
      return;
    case 'mouse_down':
      await backend.mouseDown(step.button, step.x, step.y);
      state.heldButtons.add(step.button);
      return;
    case 'mouse_up':
      await backend.mouseUp(step.button, step.x, step.y);
      state.heldButtons.delete(step.button);
      return;
    case 'mouse_move':
      if (step.durationMs > 0) {
        const start = await backend.getPointerPosition();
        const frames = Math.max(Math.floor(step.durationMs / 16), 1);
        for (let index = 1; index <= frames; index += 1) {
          const progress = index / frames;
          const x = Math.round(start.x + (step.x - start.x) * progress);
          const y = Math.round(start.y + (step.y - start.y) * progress);
          await backend.mouseMove(x, y);
          await delay(Math.floor(step.durationMs / frames));
        }
        return;
      }
      await backend.mouseMove(step.x, step.y);
      return;
    case 'mouse_click':
      for (let count = 0; count < step.count; count += 1) {
        await backend.mouseDown(step.button, step.x, step.y);
        await backend.mouseUp(step.button);
      }
      return;
    case 'scroll':
      if (step.x !== undefined && step.y !== undefined) {
        await backend.mouseMove(step.x, step.y);
      }
      if (step.direction) {
        await backend.scroll(step.amount, step.direction);
        return;
      }
      if ((step.dy ?? 0) !== 0) {
        await backend.scroll(
          Math.abs(step.dy ?? 0),
          (step.dy ?? 0) < 0 ? 'up' : 'down'
        );
      }
      return;
    case 'wait':
      await delay(step.delayMs);
      return;
    case 'type_text':
      await backend.typeText(step.text, step.delayMs, step.literal);
  }
}

async function cleanupState(
  backend: InputBackend,
  state: ExecutionState
): Promise<CleanupActionResult[]> {
  const results: CleanupActionResult[] = [];

  for (const key of [...state.heldKeys]) {
    try {
      await backend.keyUp(key);
      results.push({ kind: 'key_up', target: key, success: true });
      state.heldKeys.delete(key);
    } catch (error) {
      results.push({
        kind: 'key_up',
        target: key,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  for (const button of [...state.heldButtons]) {
    try {
      await backend.mouseUp(button);
      results.push({ kind: 'mouse_up', target: button, success: true });
      state.heldButtons.delete(button);
    } catch (error) {
      results.push({
        kind: 'mouse_up',
        target: button,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return results;
}

export async function executeInputSequence(
  backend: InputBackend,
  normalizedSteps: NormalizedSequenceStep[],
  warnings: SequenceWarning[],
  options: ExecuteSequenceOptions
): Promise<SequenceExecutionResult> {
  const state: ExecutionState = {
    heldKeys: new Set<string>(),
    heldButtons: new Set()
  };

  if (options.dryRun) {
    return {
      success: true,
      executed_steps: 0,
      total_steps: normalizedSteps.length,
      failed_step_index: null,
      warnings,
      cleanup: [],
      normalized_steps: normalizedSteps,
      dry_run: true
    };
  }

  let executedSteps = 0;
  let failedStepIndex: number | null = null;
  let errorMessage: string | undefined;

  for (let index = 0; index < normalizedSteps.length; index += 1) {
    const step = normalizedSteps[index];
    if (!step) {
      continue;
    }

    try {
      await applyStep(backend, state, step);
      executedSteps += 1;
      if (step.type !== 'wait' && step.delayMs > 0) {
        await delay(step.delayMs);
      }
    } catch (error) {
      failedStepIndex = index;
      errorMessage = error instanceof Error ? error.message : String(error);
      if (options.abortOnError) {
        break;
      }
    }
  }

  const cleanup =
    failedStepIndex !== null && options.cleanupStuckInputs
      ? await cleanupState(backend, state)
      : [];

  return {
    success: failedStepIndex === null,
    executed_steps: executedSteps,
    total_steps: normalizedSteps.length,
    failed_step_index: failedStepIndex,
    warnings,
    cleanup,
    normalized_steps: normalizedSteps,
    dry_run: false,
    ...(failedStepIndex === null
      ? {}
      : {
          error: {
            code: 'INPUT_SEQUENCE_EXECUTION_FAILED',
            message: errorMessage ?? 'Sequence execution failed'
          }
        })
  };
}
