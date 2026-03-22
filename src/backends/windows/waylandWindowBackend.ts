import type {
  BackendContext,
  CapabilityState,
  MoveWindowOptions,
  WindowBackend,
  WindowInfo,
  WindowQuery
} from '../types.js';

function unsupported(operation: string): never {
  throw new Error(
    `Wayland window backend does not support ${operation} in v1. Use capability checks and prefer inspection-only flows.`
  );
}

export async function detectWaylandWindowCapabilities(): Promise<CapabilityState> {
  return {
    name: 'windows',
    available: false,
    details:
      'Wayland session detected. Window enumeration and control are not implemented in v1 because compositor support is not portable.',
    dependencies: []
  };
}

export function createWaylandWindowBackend(context: BackendContext): WindowBackend {
  void context;
  return {
    name: 'wayland-window',
    getCapability: detectWaylandWindowCapabilities,
    async listWindows(): Promise<WindowInfo[]> {
      return [];
    },
    async getActiveWindow(): Promise<WindowInfo | null> {
      return null;
    },
    async focusWindow(query: WindowQuery): Promise<WindowInfo> {
      void query;
      unsupported('focus_window');
    },
    async moveWindow(windowId: string, options: MoveWindowOptions): Promise<void> {
      void windowId;
      void options;
      unsupported('move_window');
    },
    async resizeWindow(windowId: string, width: number, height: number): Promise<void> {
      void windowId;
      void width;
      void height;
      unsupported('resize_window');
    },
    async closeWindow(windowId: string): Promise<void> {
      void windowId;
      unsupported('close_window');
    },
    async waitForWindow(
      query: WindowQuery,
      timeoutMs: number,
      intervalMs: number
    ): Promise<WindowInfo> {
      void query;
      void timeoutMs;
      void intervalMs;
      unsupported('wait_for_window');
    }
  };
}
