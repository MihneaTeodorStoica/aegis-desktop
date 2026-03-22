import { StructuredToolError } from '../server/errors.js';
import type {
  NormalizeSequenceOptions,
  NormalizedSequenceStep,
  NormalizationResult,
  RawSequenceStep
} from './types.js';

function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeCoordinate(
  value: number,
  axis: 'x' | 'y',
  stepIndex: number,
  options: NormalizeSequenceOptions,
  warnings: NormalizationResult['warnings']
): number {
  const size = axis === 'x' ? options.screenSize?.width : options.screenSize?.height;
  if (size === undefined) {
    return value;
  }

  if (value < 0 || value >= size) {
    if (!options.clampToScreen) {
      throw new StructuredToolError(
        'INPUT_SEQUENCE_OUT_OF_BOUNDS',
        'Coordinate is outside screen bounds',
        {
          stepIndex,
          axis,
          value,
          size
        }
      );
    }

    const clamped = clampValue(value, 0, Math.max(size - 1, 0));
    warnings.push({
      stepIndex,
      message: `Clamped ${axis} from ${value} to ${clamped}`
    });
    return clamped;
  }

  return value;
}

function normalizeStep(
  step: RawSequenceStep,
  stepIndex: number,
  options: NormalizeSequenceOptions,
  warnings: NormalizationResult['warnings']
): NormalizedSequenceStep {
  const delayMs =
    step.type === 'wait' ? step.delay_ms : step.delay_ms ?? options.defaultDelayMs ?? 0;

  switch (step.type) {
    case 'key_down':
    case 'key_up':
      return { type: step.type, key: step.key, delayMs };
    case 'mouse_down':
    case 'mouse_up':
      return {
        type: step.type,
        button: step.button,
        x:
          step.x === undefined
            ? undefined
            : normalizeCoordinate(step.x, 'x', stepIndex, options, warnings),
        y:
          step.y === undefined
            ? undefined
            : normalizeCoordinate(step.y, 'y', stepIndex, options, warnings),
        delayMs
      };
    case 'mouse_move':
      return {
        type: 'mouse_move',
        x: normalizeCoordinate(step.x, 'x', stepIndex, options, warnings),
        y: normalizeCoordinate(step.y, 'y', stepIndex, options, warnings),
        durationMs: step.duration_ms ?? 0,
        delayMs
      };
    case 'mouse_click':
      return {
        type: 'mouse_click',
        button: step.button,
        x:
          step.x === undefined
            ? undefined
            : normalizeCoordinate(step.x, 'x', stepIndex, options, warnings),
        y:
          step.y === undefined
            ? undefined
            : normalizeCoordinate(step.y, 'y', stepIndex, options, warnings),
        count: step.count ?? 1,
        delayMs
      };
    case 'scroll':
      if ((step.direction === undefined) === (step.dx !== undefined || step.dy !== undefined)) {
        throw new StructuredToolError(
          'INPUT_SEQUENCE_INVALID_SCROLL',
          'Scroll step must provide direction or dx/dy, but not both',
          { stepIndex }
        );
      }
      return {
        type: 'scroll',
        x:
          step.x === undefined
            ? undefined
            : normalizeCoordinate(step.x, 'x', stepIndex, options, warnings),
        y:
          step.y === undefined
            ? undefined
            : normalizeCoordinate(step.y, 'y', stepIndex, options, warnings),
        direction: step.direction,
        dx: step.dx,
        dy: step.dy,
        amount: step.amount ?? 1,
        delayMs
      };
    case 'wait':
      return {
        type: 'wait',
        delayMs
      };
    case 'type_text':
      return {
        type: 'type_text',
        text: step.text,
        literal: step.literal ?? true,
        delayMs
      };
  }
}

export function normalizeInputSequence(
  steps: RawSequenceStep[],
  options: NormalizeSequenceOptions
): NormalizationResult {
  if (steps.length > options.maxSteps) {
    throw new StructuredToolError(
      'INPUT_SEQUENCE_TOO_LONG',
      'Input sequence exceeds configured maximum length',
      {
        stepCount: steps.length,
        maxSteps: options.maxSteps
      }
    );
  }

  const warnings: NormalizationResult['warnings'] = [];
  const normalized = steps.map((step, index) =>
    normalizeStep(step, index, options, warnings)
  );

  return {
    steps: normalized,
    warnings
  };
}
