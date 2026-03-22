import { mkdir } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

export function resolvePathFromCwd(input: string): string {
  return isAbsolute(input) ? input : resolve(process.cwd(), input);
}

export async function ensureDir(path: string): Promise<string> {
  await mkdir(path, { recursive: true });
  return path;
}
