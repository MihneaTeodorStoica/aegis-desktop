---
name: aegis-desktop
description: "Use this skill when the user wants to control the graphical desktop via the aegis_desktop MCP server: switch virtual workspaces, inspect the screen, manage windows, launch allowed apps, or send explicit mouse/keyboard input. Do not use this skill for filesystem directories, project workspaces, repositories, or shell navigation."
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

## Required execution policy

For any desktop request, follow this order:

1. Treat the request as local machine control, not an information lookup task.
2. Use `aegis_desktop` MCP tools directly; do not browse the web, search docs, or use generic search tools to decide what to do.
3. Prefer structured MCP desktop tools over raw mouse/keyboard input.
4. If the action concerns workspaces, windows, or screen state, inspect local state first when needed.
5. For coordinate-dependent or layout-dependent UI tasks such as dragging, dropping, targeting a sidebar item, or positioning content in part of a window, ground the action visually or semantically before sending input.
6. Only use raw mouse/keyboard input when no structured tool can achieve the goal.
7. Never substitute `launch_app` for a non-launch action.
8. Never call unrelated tools speculatively.

## Required routing and no-web rule

- Desktop requests are grounded in local MCP capabilities, not internet results.
- Do not use web search, browser search, or external documentation lookup just to find or justify a desktop-control action.
- If a desktop request mentions a browser app like Firefox or Chrome, that still does **not** mean to use web browsing tools unless the user wants page interaction.
- If you need clarification about local capability, inspect available local `aegis_desktop` tools or local state; do not search the web.

## Confirmation policy

- For direct, reversible desktop actions explicitly requested by the user, execute them without an extra confirmation step.
- Example: “Switch to workspace 3” should trigger the `switch_workspace` immediately.
- Ask only when the target is ambiguous, destructive, security-sensitive, or would affect data the user did not mention.

## Completion policy

- After the requested desktop action succeeds, stop and report success.
- Do not perform extra verification, capability checks, screenshots, or follow-up state reads unless the user asked to verify the result or the tool reported ambiguous success.
- Do not reread the skill after the requested action has already succeeded.

## Required tool routing

### Workspace actions
For switching or reasoning about graphical workspaces:
- Prefer the `switch_workspace` MCP tool directly.
- If tool names are exposed with prefixes, call the corresponding `aegis_desktop.switch_workspace` function rather than searching for alternatives.
- Use `list_windows` or a dedicated workspace/state tool only if needed for grounding.
- Do not call `focus_window` unless the user asked to focus a window.
- Do not call `launch_app`.
- Do not emulate workspace switching with keyboard shortcuts when a workspace tool exists.

### Window actions
For focusing/moving/resizing windows:
- Use `list_windows` first when window identity is not already known.
- Then use `focus_window`, `move_window`, `set_window_bounds`, `move_window_to_primary_monitor`, or another dedicated window tool.
- For “bring Firefox up” or similar raise/focus requests, use this recipe: `list_windows` -> identify the target window -> `focus_window({ id: ... })` -> stop.
- Do not call `focus_window({})`; provide exactly one of `id`, `exactTitle`, or `title`.
- Do not run shell commands for ordinary window focus/raise actions.

### Screen inspection
For screenshots, OCR, or visual evidence:
- Prefer `get_accessibility_tree` or `find_semantic_targets` first when the target UI is likely accessible, such as VS Code, browser chrome, menus, sidebars, or standard desktop widgets.
- If visual grounding is still needed, prefer `window_screenshot` or `inspect_screen` with `mode: "active-window"` before fullscreen capture.
- Use `take_screenshot`, `inspect_screen`, `find_text_on_screen`, `window_screenshot`, or `artifact_list` as needed.
- Minimize screenshot count when the screenshot backend is `gnome-screenshot`, because it may flash the screen.

### Input actions
For explicit typing, dragging, holding modifiers, or complex gestures:
- Use primitive input tools or `perform_input_sequence`.
- Prefer `perform_input_sequence` for modifier chords and drag operations.
- For drag/drop or placement tasks, inspect the active window first, identify the source and destination, then execute one bounded drag sequence.
- If the task says to drag something visible in a sidebar or editor, do not substitute keyboard-only actions unless the user explicitly allowed an equivalent non-drag result.
- Always include cleanup steps like `key_up` / `mouse_up`.

### Launch actions
- Use `launch_app` only for starting an allowed application.
- Use `open_url` only for opening a URL.
- Never use `launch_app` to emulate another tool.

## Indexing rules

- Workspaces are zero-based at the API layer unless the tool schema explicitly says otherwise.
- If the user says “workspace 3”, convert to `{"workspace": 2}`.
- In the user-facing response, explain the conversion briefly.

## Error handling

- If a structured tool reports unsupported or unavailable, report the limitation clearly.
- Do not fall back to keyboard shortcuts unless the user explicitly wants that and no structured option exists.
- If a call fails because required identifiers are missing, inspect state first instead of guessing.
- If you cannot find the exact local tool immediately, inspect local tool metadata or local state; do not browse the web.

## Examples

User: “Switch to workspace 3.”
Correct behavior:
1. Call `switch_workspace` with `{"workspace": 2}`.
2. Report that the desktop was switched to workspace 3 using zero-based index 2.
3. Do not ask for confirmation first.
4. Do not browse the web.

User: “Move Firefox to workspace 2.”
Correct behavior:
1. Call `list_windows`.
2. Identify Firefox.
3. Call the appropriate window/workspace tool.
4. Report the exact window and target workspace.

User: “Click and drag the current window.”
Correct behavior:
1. Prefer a structured window tool if available.
2. Otherwise use `perform_input_sequence` with explicit down/move/up steps.

User: “In VS Code, drag cleanup.sh from the sidebar into the right half of the editor.”
Correct behavior:
1. Focus the VS Code window.
2. Inspect the active window with accessibility tools first, or with `window_screenshot` / `inspect_screen(mode: "active-window")` if semantic targeting is insufficient.
3. Identify the sidebar source target and the destination editor region.
4. Execute one bounded drag sequence.
5. Do not replace the drag request with keyboard-only open/split actions unless the user explicitly accepts an equivalent result.

## Absolute prohibitions

- Do not interpret “workspace” as a directory or repo unless the user explicitly says directory, folder, repo, or project.
- Do not browse the web or docs for ordinary desktop-control requests.
- Do not call `focus_window` for workspace switching.
- Do not call `launch_app` for workspace switching.
- Do not guess window ids.
- Do not send brittle keyboard macros when a structured desktop tool exists.
- Do not ask for extra confirmation before a simple requested desktop action unless there is real ambiguity or risk.
- Do not keep exploring after the requested desktop action has already succeeded.
- Do not run irrelevant shell commands like `pwd`, `ls`, `true`, `echo`, or `export` during desktop-control flows.
- Do not perform post-success verification by default for focus, raise, move, resize, or workspace-switch actions.
- Do not perform coordinate-based clicks or drags in application UIs without first grounding the target visually or semantically.
- Do not replace an explicit drag/drop request with a keyboard shortcut workflow unless the user asked for an equivalent end state rather than the physical gesture.
