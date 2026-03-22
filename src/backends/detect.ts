import os from 'node:os';

import type {
  BackendContext,
  BackendSuite,
  CapabilityState,
  SystemInfo
} from './types.js';
import { detectSessionType } from './session.js';
import {
  createPythonAtspiBackend,
  detectAccessibilityCapabilities,
  NoopAccessibilityBackend
} from './accessibility/pythonAtspiBackend.js';
import { createClipboardBackend } from './clipboard/xclipBackend.js';
import { NoopOcrBackend, TesseractOcrBackend } from './ocr/tesseractBackend.js';
import { createLinuxLauncher } from './launch/linuxLauncher.js';
import {
  createLinuxMonitorBackend,
  detectMonitorCapabilities
} from './monitors/linuxMonitorBackend.js';
import {
  createLinuxScreenshotBackend,
  detectScreenshotCapabilities
} from './screenshot/linuxScreenshotBackend.js';
import {
  createWaylandScreenshotBackend,
  detectWaylandScreenshotCapabilities
} from './screenshot/waylandScreenshotBackend.js';
import {
  createX11InputBackend,
  detectInputCapabilities
} from './input/x11InputBackend.js';
import { createWaylandInputBackend } from './input/waylandInputBackend.js';
import {
  createX11WindowBackend,
  detectWindowCapabilities
} from './windows/x11WindowBackend.js';
import {
  createWaylandWindowBackend,
  detectWaylandWindowCapabilities
} from './windows/waylandWindowBackend.js';

export async function detectBackends(context: BackendContext): Promise<BackendSuite> {
  const sessionType = detectSessionType();
  const systemInfo: SystemInfo = {
    os: os.release(),
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
    sessionType,
    displayServer: process.env.XDG_SESSION_TYPE ?? null
  };

  const windowCapability =
    sessionType === 'wayland'
      ? await detectWaylandWindowCapabilities()
      : await detectWindowCapabilities();
  const inputCapability =
    sessionType === 'wayland'
      ? await createWaylandInputBackend(context).getCapability()
      : await detectInputCapabilities();
  const screenshotCapability =
    sessionType === 'wayland'
      ? await detectWaylandScreenshotCapabilities()
      : await detectScreenshotCapabilities(context.config);
  const monitorBackend = createLinuxMonitorBackend(context);
  const monitorCapability = await detectMonitorCapabilities();
  const launchBackend = createLinuxLauncher();
  const launchCapability = await launchBackend.getCapability();
  const clipboardBackend = createClipboardBackend(context);
  const clipboardCapability = await clipboardBackend.getCapability();
  const accessibilityCapability = await detectAccessibilityCapabilities();
  const accessibilityBackend = accessibilityCapability.available
    ? createPythonAtspiBackend(context)
    : new NoopAccessibilityBackend(accessibilityCapability.details);

  const ocrBackend = context.config.ocrEnabled
    ? new TesseractOcrBackend(context)
    : new NoopOcrBackend('OCR disabled by configuration');
  const ocrCapability = await ocrBackend.getCapability();

  const window =
    sessionType === 'wayland'
      ? createWaylandWindowBackend(context)
      : createX11WindowBackend(context);
  const input =
    sessionType === 'wayland'
      ? createWaylandInputBackend(context)
      : createX11InputBackend(context);
  const screenshot =
    sessionType === 'wayland'
      ? createWaylandScreenshotBackend(context)
      : createLinuxScreenshotBackend(context);

  const capabilities: CapabilityState[] = [
    windowCapability,
    inputCapability,
    screenshotCapability,
    monitorCapability,
    ocrCapability,
    launchCapability,
    clipboardCapability,
    accessibilityCapability
  ];

  return {
    systemInfo,
    window,
    input,
    screenshot,
    monitor: monitorBackend,
    ocr: ocrBackend,
    launch: launchBackend,
    clipboard: clipboardBackend,
    accessibility: accessibilityBackend,
    capabilities
  };
}
