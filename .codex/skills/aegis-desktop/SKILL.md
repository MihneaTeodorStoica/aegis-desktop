---
name: aegis-desktop
description: Use this skill when the user wants to control the graphical desktop via the aegis_desktop MCP server: switch virtual workspaces, inspect the screen, manage windows, launch allowed apps, or send explicit mouse/keyboard input. Do not use this skill for filesystem directories, project workspaces, repositories, or shell navigation.
---

# Aegis Desktop Skill

This skill governs graphical desktop control through the `aegis_desktop` MCP server.

## Scope

Use this skill only for GUI/desktop actions, including:
- switching graphical virtual workspaces/desktops
- listing, focusing, moving, or resizing windows
- taking screenshots or OCR/inspection
- launching allowed desktop apps or URLs
- sending low-level mouse/keyboard input

Do not use this skill for:
- changing shell working directory
- changing repository/project workspace
- searching files
- editing code unless explicitly requested

## Critical semantics

- The word **workspace** means a graphical virtual desktop managed by the window manager.
- It never means the shell current directory.
- It never means a repository root or coding workspace.
- If the user says “switch to workspace 3”, interpret this as changing the visible desktop to virtual workspace 3.

## Required decision policy

For any desktop request, follow this order:

1. Determine whether a structured MCP tool can do the action directly.
2. Prefer structured tools over raw input.
3. If the action concerns workspaces, windows, or screen state, inspect state first.
4. Only use raw mouse/keyboard input when no structured tool can achieve the goal.
5. Never substitute `launch_app` for a non-launch action.
6. Never call unrelated tools speculatively.

## Required tool routing

### Workspace actions
For switching or reasoning about graphical workspaces:
- Prefer `switch_workspace`
- Use `list_windows` or a dedicated workspace/state tool only if needed for grounding
- Do not call `focus_window` unless the user asked to focus a window
- Do not call `launch_app`

### Window actions
For focusing/moving/resizing windows:
- Use `list_windows` first when window identity is not already known
- Then use `focus_window`, `move_window`, `set_window_bounds`, or `move_window_to_primary_monitor`

### Screen inspection
For screenshots, OCR, or visual evidence:
- Use `take_screenshot`, `inspect_screen`, `find_text_on_screen`, `artifact_list`

### Input actions
For explicit typing, dragging, holding modifiers, or complex gestures:
- Use primitive input tools or `perform_input_sequence`
- Prefer `perform_input_sequence` for modifier chords and drag operations
- Always include cleanup steps like `key_up` / `mouse_up`

### Launch actions
- Use `launch_app` only for starting an allowed application
- Use `open_url` only for opening a URL
- Never use `launch_app` to emulate another tool

## Indexing rules

- Workspaces are zero-based at the API layer unless the tool schema explicitly says otherwise.
- If the user says “workspace 3”, convert to `{"workspace": 2}`.
- In the user-facing response, explain the conversion briefly.

## Error handling

- If a structured tool reports unsupported or unavailable, report the limitation clearly.
- Do not fall back to keyboard shortcuts unless the user explicitly wants that and no structured option exists.
- If a call fails because required identifiers are missing, inspect state first instead of guessing.

## Examples

User: “Switch to workspace 3.”
Correct behavior:
1. Call `switch_workspace` with `{"workspace": 2}`
2. Report that the desktop was switched to workspace 3 using zero-based index 2

User: “Move Firefox to workspace 2.”
Correct behavior:
1. Call `list_windows`
2. Identify Firefox
3. Call the appropriate window/workspace tool
4. Report the exact window and target workspace

User: “Click and drag the current window.”
Correct behavior:
1. Prefer a structured window tool if available
2. Otherwise use `perform_input_sequence` with explicit down/move/up steps

## Absolute prohibitions

- Do not interpret “workspace” as a directory or repo unless the user explicitly says directory, folder, repo, or project.
- Do not call `focus_window` for workspace switching.
- Do not call `launch_app` for workspace switching.
- Do not guess window ids.
- Do not send brittle keyboard macros when a structured desktop tool exists.
