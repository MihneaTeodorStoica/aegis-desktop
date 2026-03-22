import { spawn } from 'node:child_process';

const child = spawn('node', ['dist/src/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
});

setTimeout(() => {
  child.kill('SIGTERM');
}, 1500);

child.on('exit', (code, signal) => {
  if (code !== 0 && signal === null) {
    process.exitCode = 1;
  }
});
