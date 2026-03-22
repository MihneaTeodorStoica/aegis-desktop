---
name: aegis-desktop
description: Prefer structured MCP calls for workspace, window, and screen actions instead of raw input when `aegis_desktop` is available.
---

# Aegis Desktop Skill

Use this skill anytime you must move windows, switch workspaces, capture screenshots/OCR, launch allowed apps, or dispatch input via the `aegis_desktop` MCP server. The skill exists so the agent never falls back to brittle keyboard macros when Desktop tools can operate deterministically.

## How to use `aegis_desktop`

1. **Identify the intent.** Confirm the user wants to manipulate windows, switch desktops, take screenshots/OCR, run an allowed app, or send explicit low-level input.
2. **Map intent to canonical tools.**
   - Workspace/layout adjustments → `switch_workspace`, `list_windows`, `focus_window`, `move_window`, `set_window_bounds`, `move_window_to_primary_monitor`.
   - Screen capture/OCR → `take_screenshot`, `inspect_screen`, `find_text_on_screen`, `artifact_list`.
   - Mouse/keyboard interaction → primitive tools (`mouse_move`, `mouse_click`, `key_down`, etc.) or `perform_input_sequence`.
   - Launching apps/URLs → `launch_app` or `open_url` only when listed in `AEGIS_ALLOWED_LAUNCH_COMMANDS` (see `/home/mihnea/.codex/config.toml` environment).
3. **Validate tool zeros.** Double-check required indexes (workspaces are zero-based) and monitor references before composing the request.
4. **Provide context in the response.** When reporting what was done, mention the tool(s) used and the key parameters (target workspace index, window id/title, screenshot mode, sequence steps, etc.).

## Useful workflow tips

- **Zero-based workspace math.** If a user says “workspace three,” send `{"workspace": 2}` and mention in the explanation that desktops are zero-based.
- **Move vs. resize.** Use `move_window` when the goal is placement; prefer `set_window_bounds` when a precise geometry is required. Provide the target monitor in the request to avoid ambiguous defaults.
- **Frozen refs.** Always snapshot (e.g., `list_windows` or `inspect_screen`) before referencing because window IDs or titles can change between commands.
- **Sequence safety.** When pressing modifiers or dragging, build a `perform_input_sequence` with explicit `key_down`/`key_up` to avoid sticking keys and to capture cleanup.
- **OCR + screenshots.** If you need text evidence, call `inspect_screen` with `ocr: true` and mention the artifact path for traceability. For just a screenshot, use `take_screenshot` specifying `mode` (`fullscreen`, `active-window`, or `region`).

## Step-by-step example

1. **Switch to workspace 1.** Call `switch_workspace` with `{"workspace": 0}`; describe in the reply that the agent switched to workspace 1 (zero-based index 0).
2. **Snap a window.** Run `move_window` with target coordinates (monitorId + `x`/`y`) instead of sending shortcut keys.
3. **Capture proof.** Use `take_screenshot` (`"mode": "active-window"` or `"fullscreen"`) and mention the artifact filename located under `artifacts/`.

## When to fall back

- If the MCP server reports “unsupported,” describe the limitation and abort the action; do not send keyboard shortcuts.
- If an action requires unavailable permissions (unsafe launches, not in `AEGIS_ALLOWED_LAUNCH_COMMANDS`), ask the user how to proceed rather than improvising.

## References

- `docs/tools.md` — comprehensive tool catalog and expected parameters.
- `src/tools/windows/windowTools.ts:43-185` — validation of window and workspace tool inputs.
- `src/backends/windows/x11WindowBackend.ts:142-195` — how calls map to the backend (for debugging failures).
