import os from 'node:os';

import type {
  BackendContext,
  BackendSuite,
  CapabilityState,
  SystemInfo
} from './types.js';
import { detectSessionType } from './session.js';
import { createClipboardBackend } from './clipboard/xclipBackend.js';
import { NoopOcrBackend, TesseractOcrBackend } from './ocr/tesseractBackend.js';
import { createLinuxLauncher } from './launch/linuxLauncher.js';
import {
  createLinuxScreenshotBackend,
  detectScreenshotCapabilities
} from './screenshot/linuxScreenshotBackend.js';
import {
  createX11InputBackend,
  detectInputCapabilities
} from './input/x11InputBackend.js';
import {
  createX11WindowBackend,
  detectWindowCapabilities
} from './windows/x11WindowBackend.js';

export async function detectBackends(context: BackendContext): Promise<BackendSuite> {
  const systemInfo: SystemInfo = {
    os: os.release(),
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
    sessionType: detectSessionType(),
    displayServer: process.env.XDG_SESSION_TYPE ?? null
  };

  const windowCapability = await detectWindowCapabilities();
  const inputCapability = await detectInputCapabilities();
  const screenshotCapability = await detectScreenshotCapabilities(context.config);
  const launchBackend = createLinuxLauncher();
  const launchCapability = await launchBackend.getCapability();
  const clipboardBackend = createClipboardBackend(context);
  const clipboardCapability = await clipboardBackend.getCapability();

  const ocrBackend = context.config.ocrEnabled
    ? new TesseractOcrBackend(context)
    : new NoopOcrBackend('OCR disabled by configuration');
  const ocrCapability = await ocrBackend.getCapability();

  const window = createX11WindowBackend(context);
  const input = createX11InputBackend(context);
  const screenshot = createLinuxScreenshotBackend(context);

  const capabilities: CapabilityState[] = [
    windowCapability,
    inputCapability,
    screenshotCapability,
    ocrCapability,
    launchCapability,
    clipboardCapability
  ];

  return {
    systemInfo,
    window,
    input,
    screenshot,
    ocr: ocrBackend,
    launch: launchBackend,
    clipboard: clipboardBackend,
    capabilities
  };
}
