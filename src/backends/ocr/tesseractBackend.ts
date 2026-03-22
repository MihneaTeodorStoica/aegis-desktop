import { readFile } from 'node:fs/promises';

import type { BackendContext, CapabilityState, OcrBackend } from '../types.js';
import { isCommandAvailable, runCommand } from '../../utils/exec.js';

export class TesseractOcrBackend implements OcrBackend {
  public readonly name = 'tesseract';

  constructor(private readonly context: BackendContext) {}

  async getCapability(): Promise<CapabilityState> {
    const available = await isCommandAvailable(this.context.config.ocrCommand);
    return {
      name: 'ocr',
      available,
      details: available
        ? `OCR available via ${this.context.config.ocrCommand}.`
        : `${this.context.config.ocrCommand} is unavailable.`,
      dependencies: [this.context.config.ocrCommand]
    };
  }

  async extractText(imagePath: string): Promise<{ text: string; backend: string }> {
    const outputBase = `${imagePath}.ocr`;
    await runCommand(
      this.context.config.ocrCommand,
      [imagePath, outputBase],
      { timeoutMs: this.context.config.commandTimeoutMs }
    );
    const text = await readFile(`${outputBase}.txt`, 'utf8');
    return { text: text.trim(), backend: this.name };
  }
}

export class NoopOcrBackend implements OcrBackend {
  public readonly name = 'none';

  constructor(private readonly reason: string) {}

  async getCapability(): Promise<CapabilityState> {
    return {
      name: 'ocr',
      available: false,
      details: this.reason,
      dependencies: []
    };
  }

  async extractText(): Promise<{ text: string; backend: string }> {
    throw new Error(this.reason);
  }
}
