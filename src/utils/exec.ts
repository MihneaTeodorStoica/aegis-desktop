import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface CommandRunnerOptions {
  timeoutMs: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface CommandResult {
  command: string;
  args: string[];
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export class CommandExecutionError extends Error {
  public readonly code = 'COMMAND_EXECUTION_FAILED';

  constructor(
    message: string,
    public readonly details: {
      command: string;
      args: string[];
      stdout: string;
      stderr: string;
      exitCode: number | null;
      timeoutMs: number;
    }
  ) {
    super(message);
  }
}

export async function runCommand(
  command: string,
  args: string[],
  options: CommandRunnerOptions
): Promise<CommandResult> {
  const startedAt = Date.now();

  try {
    const result = await execFileAsync(command, args, {
      cwd: options.cwd,
      env: options.env,
      timeout: options.timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf8'
    });

    return {
      command,
      args,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: 0,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    const typed = error as NodeJS.ErrnoException & {
      stdout?: string;
      stderr?: string;
      code?: string | number;
      signal?: NodeJS.Signals;
    };

    throw new CommandExecutionError(
      `Failed to execute command: ${command}`,
      {
        command,
        args,
        stdout: typed.stdout ?? '',
        stderr: typed.stderr ?? typed.message,
        exitCode: typeof typed.code === 'number' ? typed.code : null,
        timeoutMs: options.timeoutMs
      }
    );
  }
}

export async function isCommandAvailable(command: string): Promise<boolean> {
  try {
    await runCommand('which', [command], { timeoutMs: 1000 });
    return true;
  } catch {
    return false;
  }
}
