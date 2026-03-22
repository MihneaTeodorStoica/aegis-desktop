import { fileURLToPath } from 'node:url';

import type {
  AccessibilityBackend,
  AccessibilityNode,
  BackendContext,
  CapabilityState
} from '../types.js';
import { isCommandAvailable, runCommand } from '../../utils/exec.js';

export async function detectAccessibilityCapabilities(): Promise<CapabilityState> {
  const python = await isCommandAvailable('python3');
  return {
    name: 'accessibility',
    available: python,
    details: python
      ? 'Accessibility snapshot support available when python3 and pyatspi are installed.'
      : 'Accessibility snapshot support unavailable; install python3 and pyatspi.',
    dependencies: ['python3', 'pyatspi']
  };
}

export function createPythonAtspiBackend(
  context: BackendContext
): AccessibilityBackend {
  const timeoutMs = context.config.commandTimeoutMs;
  const scriptPath = fileURLToPath(
    new URL('../../../scripts/accessibility_snapshot.py', import.meta.url)
  );

  async function runSnapshot(args: string[]): Promise<AccessibilityNode[]> {
    const result = await runCommand(
      'python3',
      [scriptPath, ...args],
      { timeoutMs }
    );
    return JSON.parse(result.stdout) as AccessibilityNode[];
  }

  return {
    name: 'python-atspi',
    getCapability: detectAccessibilityCapabilities,
    snapshotTree() {
      return runSnapshot([]);
    },
    findNodes(query: string) {
      return runSnapshot(['--query', query]);
    }
  };
}

export class NoopAccessibilityBackend implements AccessibilityBackend {
  public readonly name = 'none';

  constructor(private readonly reason: string) {}

  async getCapability(): Promise<CapabilityState> {
    return {
      name: 'accessibility',
      available: false,
      details: this.reason,
      dependencies: ['python3', 'pyatspi']
    };
  }

  async snapshotTree(): Promise<AccessibilityNode[]> {
    return [];
  }

  async findNodes(): Promise<AccessibilityNode[]> {
    return [];
  }
}
