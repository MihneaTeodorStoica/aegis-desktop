import type { AppConfig } from '../config/schema.js';
import type { CommandResult } from '../utils/exec.js';
import type { Logger } from '../utils/logger.js';
import type { Rect, SessionType } from '../types/common.js';

export interface BackendContext {
  config: AppConfig;
  logger: Logger;
}

export interface CapabilityState {
  name: string;
  available: boolean;
  details: string;
  dependencies: string[];
}

export interface SystemInfo {
  os: string;
  platform: NodeJS.Platform;
  arch: string;
  hostname: string;
  sessionType: SessionType;
  displayServer: string | null;
}

export interface MonitorInfo {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  primary: boolean;
  active: boolean;
  scale?: number;
}

export interface WindowInfo {
  id: string;
  title: string;
  className?: string;
  instanceName?: string;
  pid?: number;
  workspace?: number;
  geometry?: Rect;
  focused?: boolean;
  visible?: boolean;
}

export interface WindowQuery {
  id?: string;
  exactTitle?: string;
  title?: string;
}

export interface MoveWindowOptions {
  x?: number;
  y?: number;
  workspace?: number;
}

export interface WindowBackend {
  readonly name: string;
  getCapability(): Promise<CapabilityState>;
  listWindows(): Promise<WindowInfo[]>;
  getActiveWindow(): Promise<WindowInfo | null>;
  focusWindow(query: WindowQuery): Promise<WindowInfo>;
  moveWindow(windowId: string, options: MoveWindowOptions): Promise<void>;
  switchWorkspace(workspace: number): Promise<void>;
  resizeWindow(windowId: string, width: number, height: number): Promise<void>;
  closeWindow(windowId: string): Promise<void>;
  waitForWindow(query: WindowQuery, timeoutMs: number, intervalMs: number): Promise<WindowInfo>;
}

export interface ScreenshotOptions {
  mode: 'fullscreen' | 'active-window' | 'region';
  region?: Rect;
  outputPath: string;
}

export interface ScreenshotResult {
  path: string;
  mimeType: 'image/png';
  sizeBytes: number;
  width?: number;
  height?: number;
  backend: string;
}

export interface ScreenshotBackend {
  readonly name: string;
  getCapability(): Promise<CapabilityState>;
  takeScreenshot(options: ScreenshotOptions): Promise<ScreenshotResult>;
}

export interface InputBackend {
  readonly name: string;
  getCapability(): Promise<CapabilityState>;
  keyDown(key: string): Promise<void>;
  keyUp(key: string): Promise<void>;
  mouseDown(button: 'left' | 'middle' | 'right', x?: number, y?: number): Promise<void>;
  mouseUp(button: 'left' | 'middle' | 'right', x?: number, y?: number): Promise<void>;
  mouseMove(x: number, y: number): Promise<void>;
  mouseClick(button: 'left' | 'middle' | 'right', count: number, x?: number, y?: number): Promise<void>;
  mouseDrag(fromX: number, fromY: number, toX: number, toY: number, durationMs?: number): Promise<void>;
  typeText(text: string, delayMs: number, literal: boolean): Promise<void>;
  pressKeys(keys: string[], mode: 'combo' | 'sequence'): Promise<void>;
  getPointerPosition(): Promise<{ x: number; y: number }>;
  getScreenSize(): Promise<{ width: number; height: number }>;
  scroll(amount: number, direction: 'up' | 'down'): Promise<void>;
}

export interface MonitorBackend {
  readonly name: string;
  getCapability(): Promise<CapabilityState>;
  listMonitors(): Promise<MonitorInfo[]>;
  getPrimaryMonitor(): Promise<MonitorInfo | null>;
  getVirtualScreen(): Promise<{ width: number; height: number }>;
}

export interface AccessibilityNode {
  id: string;
  role: string;
  name?: string;
  description?: string;
  text?: string;
  bounds?: Rect;
  children?: AccessibilityNode[];
}

export interface AccessibilityBackend {
  readonly name: string;
  getCapability(): Promise<CapabilityState>;
  snapshotTree(): Promise<AccessibilityNode[]>;
  findNodes(query: string): Promise<AccessibilityNode[]>;
}

export interface OcrBackend {
  readonly name: string;
  getCapability(): Promise<CapabilityState>;
  extractText(imagePath: string): Promise<{ text: string; backend: string }>;
}

export interface LaunchOptions {
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface LaunchResult {
  pid: number | null;
  command: string;
  args: string[];
}

export interface LaunchBackend {
  readonly name: string;
  getCapability(): Promise<CapabilityState>;
  launchApp(options: LaunchOptions): Promise<LaunchResult>;
  openUrl(url: string): Promise<void>;
}

export interface ClipboardBackend {
  readonly name: string;
  getCapability(): Promise<CapabilityState>;
  readClipboard(): Promise<string>;
  writeClipboard(text: string): Promise<void>;
}

export interface BackendSuite {
  systemInfo: SystemInfo;
  window: WindowBackend;
  screenshot: ScreenshotBackend;
  input: InputBackend;
  monitor: MonitorBackend;
  ocr: OcrBackend;
  launch: LaunchBackend;
  clipboard: ClipboardBackend;
  accessibility: AccessibilityBackend;
  capabilities: CapabilityState[];
}

export interface CommandFactoryResult {
  descriptor: {
    command: string;
    args: string[];
  };
  parse?(result: CommandResult): unknown;
}
