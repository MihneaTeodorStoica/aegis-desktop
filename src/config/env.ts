import { readFile } from 'node:fs/promises';
import { z } from 'zod';

import { defaultConfig } from './defaults.js';
import { type AppConfig, configSchema } from './schema.js';
import { resolvePathFromCwd } from '../utils/paths.js';

const envSchema = z.object({
  AEGIS_ARTIFACT_DIR: z.string().optional(),
  AEGIS_OCR_ENABLED: z.string().optional(),
  AEGIS_OCR_COMMAND: z.string().optional(),
  AEGIS_COMMAND_TIMEOUT_MS: z.string().optional(),
  AEGIS_SCREENSHOT_BACKEND: z.string().optional(),
  AEGIS_INPUT_BACKEND: z.string().optional(),
  AEGIS_SAFE_MODE: z.string().optional(),
  AEGIS_ALLOWED_LAUNCH_COMMANDS: z.string().optional(),
  AEGIS_LOG_LEVEL: z.string().optional(),
  AEGIS_MAX_SCREENSHOTS_PER_MINUTE: z.string().optional(),
  AEGIS_MAX_INPUT_SEQUENCE_STEPS: z.string().optional(),
  AEGIS_DISABLED_TOOLS: z.string().optional(),
  AEGIS_ENV_ALLOWLIST: z.string().optional(),
  AEGIS_CONFIG_PATH: z.string().optional()
});

function parseBoolean(input: string | undefined, fallback: boolean): boolean {
  if (input === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(input.toLowerCase());
}

function parseCsv(input: string | undefined, fallback: string[]): string[] {
  if (!input) {
    return fallback;
  }

  return input
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

async function loadConfigFile(configPath?: string): Promise<Partial<AppConfig>> {
  if (!configPath) {
    return {};
  }

  const raw = await readFile(resolvePathFromCwd(configPath), 'utf8');
  const parsed = JSON.parse(raw) as Partial<AppConfig>;
  return parsed;
}

export async function loadConfig(): Promise<AppConfig> {
  const env = envSchema.parse(process.env);
  const fileConfig = await loadConfigFile(env.AEGIS_CONFIG_PATH);

  return configSchema.parse({
    artifactDir:
      env.AEGIS_ARTIFACT_DIR ?? fileConfig.artifactDir ?? defaultConfig.artifactDir,
    ocrEnabled: parseBoolean(
      env.AEGIS_OCR_ENABLED,
      fileConfig.ocrEnabled ?? defaultConfig.ocrEnabled
    ),
    ocrCommand:
      env.AEGIS_OCR_COMMAND ?? fileConfig.ocrCommand ?? defaultConfig.ocrCommand,
    commandTimeoutMs: Number(
      env.AEGIS_COMMAND_TIMEOUT_MS ??
        fileConfig.commandTimeoutMs ??
        defaultConfig.commandTimeoutMs
    ),
    screenshotBackend:
      env.AEGIS_SCREENSHOT_BACKEND ??
      fileConfig.screenshotBackend ??
      defaultConfig.screenshotBackend,
    inputBackend:
      env.AEGIS_INPUT_BACKEND ??
      fileConfig.inputBackend ??
      defaultConfig.inputBackend,
    safeMode: parseBoolean(
      env.AEGIS_SAFE_MODE,
      fileConfig.safeMode ?? defaultConfig.safeMode
    ),
    allowedLaunchCommands: parseCsv(
      env.AEGIS_ALLOWED_LAUNCH_COMMANDS,
      fileConfig.allowedLaunchCommands ?? [...defaultConfig.allowedLaunchCommands]
    ),
    logLevel: env.AEGIS_LOG_LEVEL ?? fileConfig.logLevel ?? defaultConfig.logLevel,
    maxScreenshotsPerMinute: Number(
      env.AEGIS_MAX_SCREENSHOTS_PER_MINUTE ??
        fileConfig.maxScreenshotsPerMinute ??
        defaultConfig.maxScreenshotsPerMinute
    ),
    maxInputSequenceSteps: Number(
      env.AEGIS_MAX_INPUT_SEQUENCE_STEPS ??
        fileConfig.maxInputSequenceSteps ??
        defaultConfig.maxInputSequenceSteps
    ),
    disabledTools: parseCsv(
      env.AEGIS_DISABLED_TOOLS,
      fileConfig.disabledTools ?? [...defaultConfig.disabledTools]
    ),
    envAllowlist: parseCsv(
      env.AEGIS_ENV_ALLOWLIST,
      fileConfig.envAllowlist ?? [...defaultConfig.envAllowlist]
    )
  });
}
