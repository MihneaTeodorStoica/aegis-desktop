import type { WindowInfo, WindowQuery } from '../backends/types.js';
import { StructuredToolError } from '../server/errors.js';
import { findBestTextMatch } from './matching.js';

export interface WindowPointTargetInput {
  x?: number;
  y?: number;
  x_ratio?: number;
  y_ratio?: number;
}

export function resolveWindowQuery(
  query: WindowQuery,
  windows: WindowInfo[],
  activeWindow: WindowInfo | null
): WindowInfo {
  if (query.id) {
    const byId = windows.find((window) => window.id.toLowerCase() === query.id?.toLowerCase());
    if (byId) {
      return byId;
    }
  }

  if (query.exactTitle) {
    const exact = windows.find((window) => window.title === query.exactTitle);
    if (exact) {
      return exact;
    }
  }

  if (query.title) {
    const match = findBestTextMatch(
      query.title,
      windows.map((window) => ({
        value: window,
        text: [window.title, window.className, window.instanceName].filter(Boolean).join(' ')
      }))
    );
    if (match) {
      return match.value;
    }
  }

  if (!query.id && !query.exactTitle && !query.title && activeWindow) {
    return activeWindow;
  }

  throw new StructuredToolError('WINDOW_NOT_FOUND', 'Window not found', { query });
}

export function resolvePointInWindow(
  window: WindowInfo,
  input: WindowPointTargetInput
): { x: number; y: number } {
  if (!window.geometry) {
    throw new StructuredToolError(
      'WINDOW_GEOMETRY_UNAVAILABLE',
      'Target window geometry is unavailable',
      { windowId: window.id, title: window.title }
    );
  }

  const hasAbsolute = input.x !== undefined || input.y !== undefined;
  const hasRelative = input.x_ratio !== undefined || input.y_ratio !== undefined;

  if (!hasAbsolute && !hasRelative) {
    throw new StructuredToolError(
      'WINDOW_COORDINATES_REQUIRED',
      'Provide x/y or x_ratio/y_ratio within the target window',
      { windowId: window.id, title: window.title }
    );
  }

  if (hasAbsolute && hasRelative) {
    throw new StructuredToolError(
      'WINDOW_COORDINATE_MODE_CONFLICT',
      'Use either absolute window coordinates or window-relative ratios',
      { windowId: window.id, title: window.title, ...input }
    );
  }

  if (hasAbsolute) {
    if (input.x === undefined || input.y === undefined) {
      throw new StructuredToolError(
        'INVALID_WINDOW_COORDINATES',
        'Window coordinates require both x and y',
        { windowId: window.id, title: window.title, ...input }
      );
    }

    if (
      input.x < 0 ||
      input.y < 0 ||
      input.x >= window.geometry.width ||
      input.y >= window.geometry.height
    ) {
      throw new StructuredToolError(
        'WINDOW_COORDINATES_OUT_OF_BOUNDS',
        'Window coordinates are outside the target window bounds',
        {
          windowId: window.id,
          title: window.title,
          x: input.x,
          y: input.y,
          width: window.geometry.width,
          height: window.geometry.height
        }
      );
    }

    return {
      x: window.geometry.x + input.x,
      y: window.geometry.y + input.y
    };
  }

  if (input.x_ratio === undefined || input.y_ratio === undefined) {
    throw new StructuredToolError(
      'INVALID_WINDOW_RATIOS',
      'Window-relative targeting requires both x_ratio and y_ratio',
      { windowId: window.id, title: window.title, ...input }
    );
  }

  const clampedX = Math.max(0, Math.min(1, input.x_ratio));
  const clampedY = Math.max(0, Math.min(1, input.y_ratio));

  return {
    x: window.geometry.x + Math.round((window.geometry.width - 1) * clampedX),
    y: window.geometry.y + Math.round((window.geometry.height - 1) * clampedY)
  };
}

export function buildWindowVisualFrame(window: WindowInfo) {
  if (!window.geometry) {
    return null;
  }

  return {
    frame_kind: 'window',
    left: window.geometry.x,
    top: window.geometry.y,
    width: window.geometry.width,
    height: window.geometry.height,
    right: window.geometry.x + window.geometry.width - 1,
    bottom: window.geometry.y + window.geometry.height - 1,
    action_space: 'window',
    coordinate_guidance:
      'This image contains only the selected window. Reuse observed x_ratio/y_ratio values with the same window when calling click_in_window, double_click_in_window, move_mouse_to_window, or drag_in_window.',
    window: {
      id: window.id,
      title: window.title,
      className: window.className,
      instanceName: window.instanceName,
      workspace: window.workspace,
      geometry: window.geometry,
      focused: window.focused,
      visible: window.visible
    }
  };
}
