import type { Rect } from '../types/common.js';

export interface PolicyContext {
  toolName: string;
}

export interface LaunchRequest {
  command: string;
  env?: Record<string, string>;
}

export interface ScreenshotRequest {
  region?: Rect;
}
