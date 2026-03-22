import type { BackendSuite } from '../backends/types.js';
import type { AppConfig } from '../config/schema.js';
import type { PolicyEngine } from '../policy/policy.js';
import type { Logger } from '../utils/logger.js';

export interface ServerContext {
  config: AppConfig;
  logger: Logger;
  backends: BackendSuite;
  policy: PolicyEngine;
}
