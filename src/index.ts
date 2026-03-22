import { detectBackends } from './backends/detect.js';
import { loadConfig } from './config/env.js';
import { PolicyEngine } from './policy/policy.js';
import { createServer } from './server/createServer.js';
import { createLogger } from './utils/logger.js';
import { ensureDir, resolvePathFromCwd } from './utils/paths.js';

async function main(): Promise<void> {
  const config = await loadConfig();
  config.artifactDir = resolvePathFromCwd(config.artifactDir);
  await ensureDir(config.artifactDir);

  const logger = createLogger(config.logLevel);
  const backends = await detectBackends({ config, logger });
  const policy = new PolicyEngine(config);

  await createServer({
    config,
    logger,
    backends,
    policy
  });

  logger.info('aegis-desktop server started', {
    sessionType: backends.systemInfo.sessionType,
    artifactDir: config.artifactDir
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
