import type { PolicyEngine } from './policy.js';

export function requireToolEnabled(policy: PolicyEngine, toolName: string): void {
  policy.assertToolEnabled({ toolName });
}
