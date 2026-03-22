import { open } from 'node:fs/promises';

export interface PngMetadata {
  width: number;
  height: number;
}

export async function readPngMetadata(path: string): Promise<PngMetadata | null> {
  const file = await open(path, 'r');
  try {
    const buffer = Buffer.alloc(24);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    if (bytesRead < 24) {
      return null;
    }
    const signature = buffer.subarray(0, 8);
    const expected = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (!signature.equals(expected)) {
      return null;
    }
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  } finally {
    await file.close();
  }
}
