import { describe, expect, it, vi } from 'vitest';

import type { InputBackend } from '../src/backends/types.js';
import { executeInputSequence } from '../src/input-sequence/execute.js';
import { normalizeInputSequence } from '../src/input-sequence/normalize.js';
import { performInputSequenceSchema } from '../src/input-sequence/schema.js';

function createBackend(): InputBackend {
  return {
    name: 'test',
    async getCapability() {
      return {
        name: 'input',
        available: true,
        details: 'test',
        dependencies: []
      };
    },
    async keyDown() {},
    async keyUp() {},
    async mouseDown() {},
    async mouseUp() {},
    async mouseMove() {},
    async mouseClick() {},
    async mouseDrag() {},
    async typeText() {},
    async pressKeys() {},
    async getPointerPosition() {
      return { x: 0, y: 0 };
    },
    async getScreenSize() {
      return { width: 200, height: 100 };
    },
    async scroll() {}
  };
}

describe('input sequence normalization', () => {
  it('accepts common top-level and step aliases', () => {
    const parsed = performInputSequenceSchema.parse({
      sequence: [
        { type: 'mouseMove', x: 10, y: 20, durationMs: 25 },
        { type: 'mouseClick', button: 'left', clicks: 2 }
      ],
      defaultDelayMs: 5,
      dryRun: true
    });

    expect(parsed.default_delay_ms).toBe(5);
    expect(parsed.dry_run).toBe(true);
    expect(parsed.steps[0]).toMatchObject({
      type: 'mouse_move',
      x: 10,
      y: 20,
      duration_ms: 25
    });
    expect(parsed.steps[1]).toMatchObject({
      type: 'mouse_click',
      button: 'left',
      count: 2
    });
  });

  it('clamps coordinates when configured', () => {
    const result = normalizeInputSequence(
      [{ type: 'mouse_move', x: 300, y: 20 }],
      {
        clampToScreen: true,
        maxSteps: 10,
        screenSize: { width: 200, height: 100 }
      }
    );

    const step = result.steps[0];
    expect(step?.type).toBe('mouse_move');
    if (step?.type === 'mouse_move') {
      expect(step.x).toBe(199);
    }
    expect(result.warnings).toHaveLength(1);
  });

  it('rejects out-of-bounds coordinates when clamping is disabled', () => {
    expect(() =>
      normalizeInputSequence([{ type: 'mouse_move', x: 300, y: 20 }], {
        clampToScreen: false,
        maxSteps: 10,
        screenSize: { width: 200, height: 100 }
      })
    ).toThrow();
  });
});

describe('input sequence execution', () => {
  it('returns a dry run without executing', async () => {
    const backend = createBackend();
    const normalized = normalizeInputSequence(
      [{ type: 'key_down', key: 'Shift_L' }],
      {
        clampToScreen: true,
        maxSteps: 10
      }
    );

    const result = await executeInputSequence(backend, normalized.steps, [], {
      abortOnError: true,
      cleanupStuckInputs: true,
      dryRun: true
    });

    expect(result.success).toBe(true);
    expect(result.executed_steps).toBe(0);
    expect(result.dry_run).toBe(true);
  });

  it('attempts cleanup on failure', async () => {
    const backend = createBackend();
    backend.mouseMove = vi.fn(async () => {
      throw new Error('boom');
    });
    backend.keyUp = vi.fn(async () => {});

    const normalized = normalizeInputSequence(
      [
        { type: 'key_down', key: 'Shift_L' },
        { type: 'mouse_move', x: 10, y: 20 }
      ],
      {
        clampToScreen: true,
        maxSteps: 10
      }
    );

    const result = await executeInputSequence(backend, normalized.steps, [], {
      abortOnError: true,
      cleanupStuckInputs: true,
      dryRun: false
    });

    expect(result.success).toBe(false);
    expect(result.failed_step_index).toBe(1);
    expect(result.cleanup.some((entry) => entry.kind === 'key_up')).toBe(true);
  });
});
