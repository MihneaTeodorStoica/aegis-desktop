export type SessionType = 'x11' | 'wayland' | 'unknown';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CommandDescriptor {
  command: string;
  args: string[];
}
