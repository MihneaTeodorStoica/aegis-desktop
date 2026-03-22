# Architecture

## Design Goals

`aegis-desktop` is built around a small number of strong boundaries:

- MCP transport should not know about desktop command details.
- tool handlers should be declarative and thin.
- backends should hide OS-specific command execution behind interfaces.
- policy should be centrally enforced, not reimplemented ad hoc.
- command execution should be centralized for timeouts and structured failure handling.

## Layering

### Entry Point

`src/index.ts` loads config, creates the logger, detects backends, creates the policy engine, and boots the MCP server.

### Transport

`src/server/createServer.ts` wires the official MCP SDK `Server` to stdio transport. Tool request handling is centralized there so all tool execution passes through common logging and structured error normalization.

### Tool Registration

`src/server/registerTools.ts` assembles the tool catalog from domain-specific modules:

- `src/tools/system/`
- `src/tools/windows/`
- `src/tools/screen/`
- `src/tools/input/`
- `src/tools/clipboard/`
- `src/tools/apps/`

### Backends

`src/backends/types.ts` defines swappable interfaces for:

- window management
- screenshots
- input
- monitors
- OCR
- launching
- clipboard
- accessibility

Current implementations are Linux/X11-focused and rely on mature CLI tools. The backend layer now also includes real session-aware backend selection so Wayland can expose partial support honestly instead of inheriting X11 assumptions.

### Policy

`src/policy/policy.ts` enforces:

- tool enable/disable rules
- safe mode restrictions
- launch allowlist rules
- env allowlist rules
- screenshot throttling
- coordinate validation

### Input Sequence Engine

Complex input is intentionally separated from tool handlers:

- `src/input-sequence/schema.ts`
- `src/input-sequence/normalize.ts`
- `src/input-sequence/execute.ts`
- `src/input-sequence/types.ts`

This keeps validation, normalization, and runtime execution distinct, which makes the sequence tool easier to extend later.

### Coordinate Routing

Monitor-aware coordinate routing lives in `src/utils/coordinates.ts`. Tools can accept absolute coordinates or monitor-relative coordinates, resolve them through the monitor backend, and only then call the input or screenshot backends.

## Error Model

Tools should fail with structured, debuggable information. Runtime failures are normalized in `src/server/errors.ts` so callers receive machine-readable error codes and context instead of raw thrown values.

## Why X11 First

Synthetic input and window control on Linux are materially different between X11 and Wayland. X11 still provides a practical baseline using mature command-line tools. The architecture keeps those dependencies behind interfaces so Wayland support can be added honestly rather than faked.
