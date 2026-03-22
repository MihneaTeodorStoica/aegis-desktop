---
name: aegis-desktop
description: Favor the aegis-desktop MCP tools for window, workspace, input, and screenshot control; only fall back to shortcuts/shell commands when the MCP server lacks coverage.
---

# MCP Desktop Controls

This skill applies to every interaction that uses the `aegis-desktop` MCP server. Always prefer the structured MCP tools so that policy checks, capability awareness, and deterministic behavior stay consistent.

## Key guidance

- Workspace changes → call `switch_workspace` with the zero-based index (workspace 3 → `{"workspace": 2}`).
- Window navigation → use `move_window`, `set_window_bounds`, or `move_window_to_primary_monitor` and honor the schemas described in `docs/tools.md:30-47`.
- Screenshots and OCR → run `take_screenshot`, `inspect_screen`, or `find_text_on_screen` instead of hacking together shell commands.
- When a backend reports “unsupported,” mention the limitation and back off. Do not improvise with disabled tools or safe-mode-blocked paths.

## References

- Tool catalog: `docs/tools.md` for the canonical list and behavior.
- Schemas: `src/tools/windows/windowTools.ts:43-185` (contains `switch_workspace` and `move_window` validation) and `src/backends/windows/x11WindowBackend.ts:142-195` (shows how `switch_workspace` maps to `wmctrl -s`).

## Examples

- “Change the view to workspace 1” → `switch_workspace` with `{"workspace": 0}`.
- “Send the terminal to workspace 3” → `switch_workspace` with `{"workspace": 2}` and mention the index offset.
- “Snap a window to the left half of monitor 0” → `move_window` with the requested coordinates instead of pressing shortcuts.
