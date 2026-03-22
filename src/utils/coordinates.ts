import type { MonitorInfo } from '../backends/types.js';
import { StructuredToolError } from '../server/errors.js';

export interface PointTargetInput {
  x?: number;
  y?: number;
  monitorId?: string;
  relativeX?: number;
  relativeY?: number;
}

export function resolvePointTarget(
  input: PointTargetInput,
  monitors: MonitorInfo[]
): { x: number; y: number; monitor?: MonitorInfo } | null {
  const hasAbsolute = input.x !== undefined || input.y !== undefined;
  const hasRelative =
    input.monitorId !== undefined ||
    input.relativeX !== undefined ||
    input.relativeY !== undefined;

  if (!hasAbsolute && !hasRelative) {
    return null;
  }

  if (hasAbsolute && hasRelative) {
    throw new StructuredToolError(
      'COORDINATE_MODE_CONFLICT',
      'Use either absolute coordinates or monitor-relative coordinates',
      { ...input }
    );
  }

  if (hasAbsolute) {
    if (input.x === undefined || input.y === undefined) {
      throw new StructuredToolError(
      'INVALID_COORDINATES',
      'Absolute coordinates require both x and y',
      { ...input }
    );
  }
    return { x: input.x, y: input.y };
  }

  if (
    input.monitorId === undefined ||
    input.relativeX === undefined ||
    input.relativeY === undefined
  ) {
    throw new StructuredToolError(
      'INVALID_RELATIVE_COORDINATES',
      'Monitor-relative coordinates require monitorId, relativeX, and relativeY',
      { ...input }
    );
  }

  const monitor = monitors.find((value) => value.id === input.monitorId);
  if (!monitor) {
    throw new StructuredToolError('MONITOR_NOT_FOUND', 'Unknown monitor id', {
      monitorId: input.monitorId
    });
  }

  if (
    input.relativeX < 0 ||
    input.relativeY < 0 ||
    input.relativeX >= monitor.width ||
    input.relativeY >= monitor.height
  ) {
    throw new StructuredToolError(
      'RELATIVE_COORDINATES_OUT_OF_BOUNDS',
      'Monitor-relative coordinates are outside the selected monitor bounds',
      {
        monitorId: input.monitorId,
        relativeX: input.relativeX,
        relativeY: input.relativeY,
        monitor
      }
    );
  }

  return {
    x: monitor.x + input.relativeX,
    y: monitor.y + input.relativeY,
    monitor
  };
}
