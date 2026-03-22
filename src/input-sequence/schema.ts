import { z } from 'zod';

const buttonSchema = z.enum(['left', 'middle', 'right']);
const keySchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9_+-]+$/, 'Invalid key token');
const nonNegativeInt = z.number().int().min(0);
const positiveInt = z.number().int().positive();

export const sequenceStepSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('key_down'),
    key: keySchema,
    delay_ms: nonNegativeInt.optional()
  }),
  z.object({
    type: z.literal('key_up'),
    key: keySchema,
    delay_ms: nonNegativeInt.optional()
  }),
  z.object({
    type: z.literal('mouse_down'),
    button: buttonSchema,
    x: nonNegativeInt.optional(),
    y: nonNegativeInt.optional(),
    delay_ms: nonNegativeInt.optional()
  }),
  z.object({
    type: z.literal('mouse_up'),
    button: buttonSchema,
    x: nonNegativeInt.optional(),
    y: nonNegativeInt.optional(),
    delay_ms: nonNegativeInt.optional()
  }),
  z.object({
    type: z.literal('mouse_move'),
    x: nonNegativeInt,
    y: nonNegativeInt,
    duration_ms: nonNegativeInt.optional(),
    delay_ms: nonNegativeInt.optional()
  }),
  z.object({
    type: z.literal('mouse_click'),
    button: buttonSchema,
    x: nonNegativeInt.optional(),
    y: nonNegativeInt.optional(),
    count: positiveInt.optional(),
    delay_ms: nonNegativeInt.optional()
  }),
  z.object({
    type: z.literal('scroll'),
    x: nonNegativeInt.optional(),
    y: nonNegativeInt.optional(),
    direction: z.enum(['up', 'down']).optional(),
    dx: z.number().int().optional(),
    dy: z.number().int().optional(),
    amount: positiveInt.optional(),
    delay_ms: nonNegativeInt.optional()
  }),
  z.object({
    type: z.literal('wait'),
    delay_ms: nonNegativeInt
  }),
  z.object({
    type: z.literal('type_text'),
    text: z.string(),
    literal: z.boolean().optional(),
    delay_ms: nonNegativeInt.optional()
  })
]);

export const performInputSequenceSchema = z.object({
  steps: z.array(sequenceStepSchema).min(1).max(512),
  default_delay_ms: nonNegativeInt.optional(),
  abort_on_error: z.boolean().default(true),
  cleanup_stuck_inputs: z.boolean().default(true),
  clamp_to_screen: z.boolean().default(true),
  dry_run: z.boolean().default(false)
});
