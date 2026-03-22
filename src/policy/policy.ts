import { z } from 'zod';

import type { AppConfig } from '../config/schema.js';
import type { PolicyContext, LaunchRequest, ScreenshotRequest } from './types.js';

export class PolicyError extends Error {
  public readonly code = 'POLICY_VIOLATION';

  constructor(message: string, public readonly details: Record<string, unknown>) {
    super(message);
  }
}

const boundsSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().positive(),
  height: z.number().int().positive()
});

export class PolicyEngine {
  private screenshotTimestamps: number[] = [];

  constructor(private readonly config: AppConfig) {}

  assertToolEnabled(context: PolicyContext): void {
    if (this.config.disabledTools.includes(context.toolName)) {
      throw new PolicyError(`Tool disabled by policy: ${context.toolName}`, {
        toolName: context.toolName
      });
    }

    const riskyTools = new Set([
      'launch_app',
      'mouse_move',
      'mouse_click',
      'mouse_drag',
      'type_text',
      'press_keys',
      'write_clipboard',
      'move_window',
      'resize_window',
      'close_window'
    ]);

    if (this.config.safeMode && riskyTools.has(context.toolName)) {
      throw new PolicyError(`Tool disabled in safe mode: ${context.toolName}`, {
        toolName: context.toolName
      });
    }
  }

  assertLaunchAllowed(request: LaunchRequest): void {
    if (!this.config.allowedLaunchCommands.includes(request.command)) {
      throw new PolicyError(`Launch command not allowed: ${request.command}`, {
        command: request.command
      });
    }

    const envKeys = Object.keys(request.env ?? {});
    const disallowed = envKeys.filter(
      (key) => !this.config.envAllowlist.includes(key)
    );
    if (disallowed.length > 0) {
      throw new PolicyError('Launch env contains disallowed keys', {
        disallowed
      });
    }
  }

  assertScreenshotAllowed(request: ScreenshotRequest): void {
    const now = Date.now();
    const windowStart = now - 60_000;
    this.screenshotTimestamps = this.screenshotTimestamps.filter(
      (timestamp) => timestamp >= windowStart
    );

    if (this.screenshotTimestamps.length >= this.config.maxScreenshotsPerMinute) {
      throw new PolicyError('Screenshot rate limit exceeded', {
        maxScreenshotsPerMinute: this.config.maxScreenshotsPerMinute
      });
    }

    if (request.region) {
      boundsSchema.parse(request.region);
    }

    this.screenshotTimestamps.push(now);
  }

  assertCoordinates(x: number, y: number): void {
    if (x < 0 || y < 0) {
      throw new PolicyError('Coordinates must be non-negative', { x, y });
    }
  }
}
