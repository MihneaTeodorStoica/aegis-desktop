export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const priorities: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

export interface Logger {
  debug(message: string, context?: unknown): void;
  info(message: string, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  error(message: string, context?: unknown): void;
}

export function createLogger(level: LogLevel): Logger {
  const threshold = priorities[level];

  function emit(entryLevel: LogLevel, message: string, context?: unknown): void {
    if (priorities[entryLevel] < threshold) {
      return;
    }

    const payload = {
      ts: new Date().toISOString(),
      level: entryLevel,
      message,
      ...(context === undefined ? {} : { context })
    };

    process.stderr.write(`${JSON.stringify(payload)}\n`);
  }

  return {
    debug: (message, context) => emit('debug', message, context),
    info: (message, context) => emit('info', message, context),
    warn: (message, context) => emit('warn', message, context),
    error: (message, context) => emit('error', message, context)
  };
}
