# aegis-desktop

Extensible desktop-control MCP server for Linux-first agentic automation, with pluggable backends for windows, input, screenshots, OCR, app launching, and policy-aware computer interaction.

## What It Is

`aegis-desktop` is a production-oriented Model Context Protocol server for structured desktop control on Linux systems. It is designed for agentic computer use where an LLM or automation agent needs to inspect desktop state, focus and manage windows, take screenshots, perform keyboard and mouse input, read or write the clipboard, and launch applications through explicit tools instead of opaque shell scripts.

The first implementation is intentionally Linux/X11-first. It uses mature command-line utilities such as `wmctrl`, `xdotool`, `maim`, `import`, `gnome-screenshot`, `xclip`, and `tesseract` where available, while exposing capability state and degrading honestly when a dependency is missing.

## Why It Exists

Desktop automation often starts as brittle shell glue. That does not scale well for long-lived agent workflows because:

- state is hard to inspect before acting
- failures are poorly structured
- safety controls are bolted on late
- Linux/X11 and Wayland differences get hidden instead of modeled
- higher-level operations become difficult to reason about

`aegis-desktop` provides a clean foundation for a serious AEGIS desktop-control stack by separating transport, tools, policy, backend selection, and command execution.

## Feature Overview

- stdio MCP server using the official MCP TypeScript SDK
- Linux Mint / Ubuntu-like focus with honest X11-first support
- modular backend interfaces for windows, screenshots, input, OCR, launching, and clipboard
- explicit tool schemas with Zod validation
- structured tool errors and capability reporting
- policy layer with safe mode, launch allowlists, tool disable flags, screenshot throttling, env restrictions, and coordinate checks
- stateful low-level input primitives: `key_down`, `key_up`, `mouse_down`, `mouse_up`, `mouse_move`
- first-class low-level orchestration tool: `perform_input_sequence`
- artifact management for screenshots and inspection output
- strict TypeScript, ESLint, Prettier, tests, and smoke script

## Architecture Overview

The server is split into distinct layers:

- transport layer: MCP server setup and stdio transport
- tool registration layer: tool catalog assembly and request handling
- backend abstraction layer: window, screenshot, input, OCR, launch, and clipboard interfaces
- policy layer: runtime checks and configurable restrictions
- utility layer: logging, command execution, path handling, matching
- config layer: defaults, env/config-file parsing, typed validation
- input sequence layer: validation, normalization, planning, and execution for complex low-level input actions

Relevant paths:

- `src/index.ts`
- `src/server/`
- `src/backends/`
- `src/policy/`
- `src/config/`
- `src/tools/`
- `src/input-sequence/`

See [architecture.md](/home/mihnea/Programming/GitHub/aegis-desktop/docs/architecture.md) for a deeper walkthrough.

## Supported Environments

Current target:

- Linux Mint
- Ubuntu
- Debian-like desktop systems
- X11 desktop sessions

Current partial or unsupported areas:

- Wayland: explicitly reported as partial/unsupported for many input and window operations
- accessibility-tree targeting: not yet implemented
- semantic element targeting: not yet implemented

## Backend Strategy

The implementation is intentionally pluggable. The v1 default backend strategy is:

- window management: `wmctrl` plus `xdotool` and `xwininfo`
- input automation: `xdotool`
- screenshots: `maim`, then `import`, then `gnome-screenshot`
- OCR: `tesseract` when enabled and installed, otherwise graceful degradation
- clipboard: `xclip`, then `xsel`
- app launching: `spawn` and `xdg-open`

Future Wayland and accessibility-driven backends can be added behind the same interfaces without rewriting tool handlers.

See [backends.md](/home/mihnea/Programming/GitHub/aegis-desktop/docs/backends.md).

## Dependencies And Optional Binaries

Required runtime:

- Node.js 20+

Strongly recommended Linux binaries:

- `wmctrl`
- `xdotool`
- `xwininfo`
- `maim` or `imagemagick` (`import`) or `gnome-screenshot`
- `xclip` or `xsel`
- `xdg-open`

Optional:

- `tesseract`

Example install on Ubuntu-like systems:

```bash
sudo apt update
sudo apt install -y wmctrl xdotool x11-utils maim imagemagick gnome-screenshot xclip xsel xdg-utils tesseract-ocr
```

## Installation

```bash
git clone <your-repo-url> aegis-desktop
cd aegis-desktop
npm install
```

## Local Development

```bash
npm run dev
```

Validation loop:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Build

```bash
npm run build
```

## Run

Development:

```bash
npm run dev
```

Built server:

```bash
npm run build
npm start
```

Lightweight smoke check:

```bash
npm run smoke
```

## Tool Catalog

System and diagnostics:

- `get_system_info`
- `list_capabilities`
- `health_check`

Windows:

- `list_windows`
- `get_active_window`
- `focus_window`
- `move_window`
- `resize_window`
- `set_window_bounds`
- `close_window`
- `wait_for_window`
- `move_window_to_primary_monitor`

Screen and artifacts:

- `take_screenshot`
- `window_screenshot`
- `inspect_screen`
- `find_text_on_screen`
- `artifact_list`

Input:

- `key_down`
- `key_up`
- `mouse_down`
- `mouse_up`
- `mouse_move`
- `mouse_click`
- `mouse_drag`
- `type_text`
- `press_keys`
- `scroll_mouse`
- `get_pointer_position`
- `perform_input_sequence`

Apps and clipboard:

- `launch_app`
- `open_url`
- `read_clipboard`
- `write_clipboard`

See [tools.md](/home/mihnea/Programming/GitHub/aegis-desktop/docs/tools.md) for schemas, behavior, and examples.

## Stateful Input Model

`aegis-desktop` does not treat input as purely stateless. The input backend exposes low-level primitives that support multi-step interactions:

- `key_down`
- `key_up`
- `mouse_down`
- `mouse_up`
- `mouse_move`

High-level tools such as `mouse_drag` and `press_keys` build on those primitives. For more complex interactions, use `perform_input_sequence`.

### `perform_input_sequence`

This tool validates and executes an ordered sequence of low-level steps as one logical action. It supports:

- modifier-hold plus drag
- multi-step drag operations
- keyboard plus mouse combinations
- scroll sequences
- dry-run validation
- cleanup of held keys/buttons after a mid-sequence failure

Example shift-drag:

```json
{
  "steps": [
    { "type": "key_down", "key": "Shift_L" },
    { "type": "mouse_down", "button": "left", "x": 100, "y": 100 },
    { "type": "mouse_move", "x": 300, "y": 300, "duration_ms": 200 },
    { "type": "mouse_up", "button": "left" },
    { "type": "key_up", "key": "Shift_L" }
  ]
}
```

Example hold-`w` while moving the mouse:

```json
{
  "steps": [
    { "type": "key_down", "key": "w" },
    { "type": "mouse_move", "x": 800, "y": 450, "duration_ms": 100 },
    { "type": "mouse_move", "x": 900, "y": 450, "duration_ms": 100 },
    { "type": "key_up", "key": "w" }
  ]
}
```

Safe dry run:

```json
{
  "dry_run": true,
  "steps": [
    { "type": "key_down", "key": "Control_L" },
    { "type": "key_down", "key": "c" },
    { "type": "key_up", "key": "c" },
    { "type": "key_up", "key": "Control_L" }
  ]
}
```

## Configuration Reference

Configuration sources:

- environment variables
- optional JSON config file via `AEGIS_CONFIG_PATH`
- sensible defaults

Important options:

- `AEGIS_ARTIFACT_DIR`
- `AEGIS_OCR_ENABLED`
- `AEGIS_OCR_COMMAND`
- `AEGIS_COMMAND_TIMEOUT_MS`
- `AEGIS_SCREENSHOT_BACKEND`
- `AEGIS_INPUT_BACKEND`
- `AEGIS_SAFE_MODE`
- `AEGIS_ALLOWED_LAUNCH_COMMANDS`
- `AEGIS_LOG_LEVEL`
- `AEGIS_MAX_SCREENSHOTS_PER_MINUTE`
- `AEGIS_MAX_INPUT_SEQUENCE_STEPS`

See [configuration.md](/home/mihnea/Programming/GitHub/aegis-desktop/docs/configuration.md) for the full reference.

## Safe Mode And Policy

The policy layer is intentionally explicit. Current controls include:

- launch command allowlist
- env allowlist for launched processes
- tool-level disable flags
- screenshot rate limiting
- coordinate validation
- input-sensitive safe mode
- command timeouts

When `AEGIS_SAFE_MODE=true`, risky operations such as app launching, typing, mouse clicks, drags, and window mutations are blocked.

## Codex MCP Config Example

Example local stdio configuration for Codex:

```json
{
  "mcpServers": {
    "aegis-desktop": {
      "command": "node",
      "args": ["/absolute/path/to/aegis-desktop/dist/src/index.js"],
      "env": {
        "AEGIS_ARTIFACT_DIR": "/absolute/path/to/aegis-desktop/artifacts",
        "AEGIS_SAFE_MODE": "false",
        "AEGIS_OCR_ENABLED": "true"
      }
    }
  }
}
```

There is also a reusable example at [codex-stdio.json](/home/mihnea/Programming/GitHub/aegis-desktop/examples/codex-stdio.json).

## Troubleshooting

- If `list_capabilities` reports missing backends, install the corresponding Linux binaries.
- If running under Wayland, expect partial or unavailable support for window management and synthetic input.
- If screenshots fail, try setting `AEGIS_SCREENSHOT_BACKEND=maim` or `import`.
- If OCR is empty, verify `tesseract` is installed and `AEGIS_OCR_ENABLED=true`.
- If launch requests are denied, check `AEGIS_ALLOWED_LAUNCH_COMMANDS`.
- If stateful input sequences are rejected, inspect validation errors and coordinate clamping warnings.

## Security Notes

- The server never logs to stdout; stdout is reserved for MCP transport.
- App launching is policy-gated.
- Environment variables passed to launched apps are allowlisted.
- Screenshot generation is throttled.
- Input tooling validates coordinates and step structure.
- Unsupported features are reported honestly instead of silently faked.

This is still a powerful desktop-control surface. Run it only in environments you trust and configure policy conservatively for unattended usage.

## Extensibility Guide

To add a new backend or tool:

1. Add or extend an interface in `src/backends/types.ts`.
2. Implement the backend in a dedicated backend module.
3. Expose capability detection in `src/backends/detect.ts`.
4. Add policy checks if the new action is sensitive.
5. Register the tool in `src/server/registerTools.ts`.
6. Document the behavior and add tests.

The goal is to keep tools thin and backends swappable.

## Roadmap

- Wayland-aware input and window backends
- accessibility-tree integration
- richer OCR engines and language packs
- multi-monitor aware coordinate routing
- semantic UI targeting
- recording and replay
- policy plugins and richer approval models

See [roadmap.md](/home/mihnea/Programming/GitHub/aegis-desktop/docs/roadmap.md).
