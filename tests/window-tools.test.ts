import { describe, expect, it, vi } from 'vitest';

import { createWindowTools } from '../src/tools/windows/windowTools.js';

describe('move_window tool', () => {
  it('accepts workspace-only moves', async () => {
    const moveWindow = vi.fn(async () => undefined);
    const switchWorkspace = vi.fn(async () => undefined);
    const assertToolEnabled = vi.fn();
    const assertCoordinates = vi.fn();

    const tools = createWindowTools({
      config: {} as never,
      logger: {} as never,
      backends: {
        window: {
          listWindows: vi.fn(),
          getActiveWindow: vi.fn(),
          focusWindow: vi.fn(),
          moveWindow,
          resizeWindow: vi.fn(),
          closeWindow: vi.fn(),
          switchWorkspace,
          waitForWindow: vi.fn(),
          getCapability: vi.fn(),
          name: 'test-window'
        }
      } as never,
      policy: {
        assertToolEnabled,
        assertCoordinates
      } as never
    });

    const tool = tools.find((entry) => entry.name === 'move_window');
    expect(tool).toBeDefined();

    const input = tool!.inputSchema.parse({
      windowId: '0x123',
      workspace: 2
    });

    await tool!.execute(input);

    expect(assertToolEnabled).toHaveBeenCalledWith({ toolName: 'move_window' });
    expect(assertCoordinates).not.toHaveBeenCalled();
    expect(moveWindow).toHaveBeenCalledWith('0x123', { workspace: 2, x: undefined, y: undefined });
  });

  it('rejects partial coordinates without workspace', () => {
    const tools = createWindowTools({
      config: {} as never,
      logger: {} as never,
      backends: {} as never,
      policy: {} as never
    });

    const tool = tools.find((entry) => entry.name === 'move_window');
    expect(tool).toBeDefined();

    expect(() => {
      tool!.inputSchema.parse({
        windowId: '0x123',
        x: 10
      });
    }).toThrow(/Provide workspace or both x and y|Provide both x and y together/);
  });
});

describe('switch_workspace tool', () => {
  it('switches via the backend', async () => {
    const switchWorkspace = vi.fn(async () => undefined);

    const tools = createWindowTools({
      config: {} as never,
      logger: {} as never,
      backends: {
        window: {
          listWindows: vi.fn(),
          getActiveWindow: vi.fn(),
          focusWindow: vi.fn(),
          moveWindow: vi.fn(),
          resizeWindow: vi.fn(),
          closeWindow: vi.fn(),
          waitForWindow: vi.fn(),
          switchWorkspace,
          getCapability: vi.fn(),
          name: 'test-window'
        }
      } as never,
      policy: {
        assertToolEnabled: vi.fn(),
        assertCoordinates: vi.fn()
      } as never
    });

    const tool = tools.find((entry) => entry.name === 'switch_workspace');
    expect(tool).toBeDefined();

    const input = tool!.inputSchema.parse({ workspace: 0 });
    await tool!.execute(input);

    expect(switchWorkspace).toHaveBeenCalledWith(0);
  });
});
