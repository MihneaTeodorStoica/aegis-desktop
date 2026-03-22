import { z } from 'zod';

export const configSchema = z.object({
  artifactDir: z.string().min(1),
  ocrEnabled: z.boolean(),
  ocrCommand: z.string().min(1),
  commandTimeoutMs: z.number().int().positive(),
  screenshotBackend: z.enum(['auto', 'maim', 'import', 'gnome-screenshot']),
  inputBackend: z.enum(['auto', 'xdotool']),
  safeMode: z.boolean(),
  allowedLaunchCommands: z.array(z.string().min(1)),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
  maxScreenshotsPerMinute: z.number().int().positive(),
  maxInputSequenceSteps: z.number().int().positive(),
  disabledTools: z.array(z.string().min(1)),
  envAllowlist: z.array(z.string().min(1))
});

export type AppConfig = z.infer<typeof configSchema>;
