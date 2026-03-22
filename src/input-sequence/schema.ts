import { z } from 'zod';

function normalizeStepAlias(step: unknown): unknown {
  if (!step || typeof step !== 'object' || Array.isArray(step)) {
    return step;
  }

  const record = { ...(step as Record<string, unknown>) };
  const rawType = typeof record.type === 'string' ? record.type : undefined;

  if (rawType) {
    record.type = rawType
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/-/g, '_')
      .toLowerCase();
  }

  if (record.durationMs !== undefined && record.duration_ms === undefined) {
    record.duration_ms = record.durationMs;
  }
  if (record.delayMs !== undefined && record.delay_ms === undefined) {
    record.delay_ms = record.delayMs;
  }
  if (record.clicks !== undefined && record.count === undefined) {
    record.count = record.clicks;
  }

  return record;
}

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

export const performInputSequenceSchema = z.preprocess((input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return input;
  }

  const record = { ...(input as Record<string, unknown>) };
  const rawSteps = Array.isArray(record.steps)
    ? record.steps
    : Array.isArray(record.sequence)
      ? record.sequence
      : undefined;

  if (rawSteps) {
    record.steps = rawSteps.map((step) => normalizeStepAlias(step));
  }
  delete record.sequence;

  if (record.defaultDelayMs !== undefined && record.default_delay_ms === undefined) {
    record.default_delay_ms = record.defaultDelayMs;
  }
  if (record.abortOnError !== undefined && record.abort_on_error === undefined) {
    record.abort_on_error = record.abortOnError;
  }
  if (record.cleanupStuckInputs !== undefined && record.cleanup_stuck_inputs === undefined) {
    record.cleanup_stuck_inputs = record.cleanupStuckInputs;
  }
  if (record.clampToScreen !== undefined && record.clamp_to_screen === undefined) {
    record.clamp_to_screen = record.clampToScreen;
  }
  if (record.dryRun !== undefined && record.dry_run === undefined) {
    record.dry_run = record.dryRun;
  }

  return record;
}, z.object({
  steps: z.array(sequenceStepSchema).min(1).max(512),
  default_delay_ms: nonNegativeInt.optional(),
  abort_on_error: z.boolean().default(true),
  cleanup_stuck_inputs: z.boolean().default(true),
  clamp_to_screen: z.boolean().default(true),
  dry_run: z.boolean().default(false)
}));
