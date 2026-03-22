import { z } from 'zod';

import type { ToolDefinition } from '../types.js';
import type { ServerContext } from '../../server/context.js';
import { requireToolEnabled } from '../../policy/checks.js';
import { createPerformInputSequenceTool } from './performInputSequence.js';

export function createInputTools(context: ServerContext): Array<ToolDefinition<z.ZodTypeAny, unknown>> {
  return [
    createPerformInputSequenceTool(context),
    {
      name: 'key_down',
      description: 'Press and hold a single key.',
      inputSchema: z.object({
        key: z.string().min(1)
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'key_down');
        await context.backends.input.keyDown(input.key);
        return { ok: true };
      }
    },
    {
      name: 'key_up',
      description: 'Release a previously held key.',
      inputSchema: z.object({
        key: z.string().min(1)
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'key_up');
        await context.backends.input.keyUp(input.key);
        return { ok: true };
      }
    },
    {
      name: 'mouse_down',
      description: 'Press and hold a mouse button, optionally after moving.',
      inputSchema: z.object({
        button: z.enum(['left', 'middle', 'right']),
        x: z.number().int().min(0).optional(),
        y: z.number().int().min(0).optional()
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'mouse_down');
        await context.backends.input.mouseDown(input.button, input.x, input.y);
        return { ok: true };
      }
    },
    {
      name: 'mouse_up',
      description: 'Release a mouse button, optionally after moving.',
      inputSchema: z.object({
        button: z.enum(['left', 'middle', 'right']),
        x: z.number().int().min(0).optional(),
        y: z.number().int().min(0).optional()
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'mouse_up');
        await context.backends.input.mouseUp(input.button, input.x, input.y);
        return { ok: true };
      }
    },
    {
      name: 'mouse_move',
      description: 'Move the pointer to absolute coordinates.',
      inputSchema: z.object({
        x: z.number().int().min(0),
        y: z.number().int().min(0)
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'mouse_move');
        context.policy.assertCoordinates(input.x, input.y);
        await context.backends.input.mouseMove(input.x, input.y);
        return { ok: true };
      }
    },
    {
      name: 'mouse_click',
      description: 'Click the left, middle, or right mouse button, optionally after moving.',
      inputSchema: z.object({
        button: z.enum(['left', 'middle', 'right']).default('left'),
        count: z.number().int().positive().default(1),
        x: z.number().int().min(0).optional(),
        y: z.number().int().min(0).optional()
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'mouse_click');
        if ((input.x === undefined) !== (input.y === undefined)) {
          throw new Error('Provide both x and y or neither');
        }
        for (let count = 0; count < input.count; count += 1) {
          await context.backends.input.mouseDown(input.button, input.x, input.y);
          await context.backends.input.mouseUp(input.button);
        }
        return { ok: true };
      }
    },
    {
      name: 'mouse_drag',
      description: 'Drag from one coordinate to another.',
      inputSchema: z.object({
        fromX: z.number().int().min(0),
        fromY: z.number().int().min(0),
        toX: z.number().int().min(0),
        toY: z.number().int().min(0),
        durationMs: z.number().int().positive().optional()
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'mouse_drag');
        await context.backends.input.mouseMove(input.fromX, input.fromY);
        await context.backends.input.mouseDown('left');
        await context.backends.input.mouseDrag(
          input.fromX,
          input.fromY,
          input.toX,
          input.toY,
          input.durationMs
        );
        await context.backends.input.mouseUp('left');
        return { ok: true };
      }
    },
    {
      name: 'type_text',
      description: 'Type text with an optional delay and literal-mode handling.',
      inputSchema: z.object({
        text: z.string(),
        delayMs: z.number().int().min(0).default(12),
        literal: z.boolean().default(true)
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'type_text');
        await context.backends.input.typeText(input.text, input.delayMs, input.literal);
        return { ok: true };
      }
    },
    {
      name: 'press_keys',
      description: 'Press a key combination or key sequence.',
      inputSchema: z.object({
        keys: z.array(z.string().min(1)).min(1),
        mode: z.enum(['combo', 'sequence']).default('combo')
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'press_keys');
        if (input.mode === 'combo') {
          for (const key of input.keys) {
            await context.backends.input.keyDown(key);
          }
          for (const key of [...input.keys].reverse()) {
            await context.backends.input.keyUp(key);
          }
        } else {
          for (const key of input.keys) {
            await context.backends.input.keyDown(key);
            await context.backends.input.keyUp(key);
          }
        }
        return { ok: true };
      }
    },
    {
      name: 'get_pointer_position',
      description: 'Return the current pointer coordinates.',
      inputSchema: z.object({}).strict(),
      async execute() {
        return await context.backends.input.getPointerPosition();
      }
    },
    {
      name: 'scroll_mouse',
      description: 'Scroll the mouse wheel up or down.',
      inputSchema: z.object({
        direction: z.enum(['up', 'down']),
        amount: z.number().int().positive().default(1)
      }),
      async execute(input) {
        requireToolEnabled(context.policy, 'scroll_mouse');
        await context.backends.input.scroll(input.amount, input.direction);
        return { ok: true };
      }
    }
  ];
}
