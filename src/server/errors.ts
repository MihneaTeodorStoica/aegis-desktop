export interface StructuredErrorShape {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class StructuredToolError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
  }

  toShape(): StructuredErrorShape {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {})
    };
  }
}

export function normalizeError(error: unknown): StructuredErrorShape {
  if (error instanceof StructuredToolError) {
    return error.toShape();
  }

  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    message: 'Unknown error'
  };
}
