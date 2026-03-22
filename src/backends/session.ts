import type { SessionType } from '../types/common.js';

export function detectSessionType(): SessionType {
  const value = (process.env.XDG_SESSION_TYPE ?? '').toLowerCase();
  if (value === 'x11') {
    return 'x11';
  }
  if (value === 'wayland') {
    return 'wayland';
  }
  return 'unknown';
}
