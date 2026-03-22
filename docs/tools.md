# Tools

## Tool Design

Each tool has:

- explicit Zod input validation
- structured JSON-like output rendered through MCP text content
- backend-driven behavior
- policy checks where appropriate

## System Tools

### `get_system_info`

Returns OS/session basics, session type, hostname, server version, and detected capability information.

### `list_capabilities`

Returns backend availability and degradation details.

### `health_check`

Returns readiness and backend diagnostics.

### `list_monitors`

Returns detected monitor geometry, origin, primary-monitor state, and active state.

## Window Tools

- `list_windows`
- `get_active_window`
- `focus_window`
- `move_window`
- `resize_window`
- `set_window_bounds`
- `close_window`
- `wait_for_window`
- `move_window_to_primary_monitor`

Window targeting accepts either direct ids or title-based matching depending on the tool.

`move_window` accepts either absolute coordinates (`x` and `y`), a target `workspace`, or both in one request.

## Screen Tools

### `take_screenshot`

Modes:

- `fullscreen`
- `active-window`
- `region`

Artifacts are always written to the configured artifact directory.

Region capture can be expressed with absolute coordinates or monitor-relative coordinates.

### `inspect_screen`

Captures a screenshot and optionally performs OCR.

### `find_text_on_screen`

Runs OCR on a fresh screenshot and checks whether the query is present.

### `artifact_list`

Lists generated artifacts in the artifact directory.

## Input Tools

### Low-Level Primitives

- `key_down`
- `key_up`
- `mouse_down`
- `mouse_up`
- `mouse_move`

These primitives are intended for stateful agent interactions.

### Higher-Level Input

- `mouse_click`
- `mouse_drag`
- `type_text`
- `press_keys`
- `scroll_mouse`
- `get_pointer_position`

These remain available for convenience, but they share the same backend semantics as the primitives.

Several pointer tools also support monitor-relative coordinates through `monitorId`, `relativeX`, and `relativeY`.

### `perform_input_sequence`

Purpose:

- execute a timed ordered sequence as one logical action
- validate the sequence before execution
- track held keys/buttons
- optionally clamp coordinates
- optionally dry-run
- attempt cleanup if execution fails mid-sequence

Supported step types:

- `key_down`
- `key_up`
- `mouse_down`
- `mouse_up`
- `mouse_move`
- `mouse_click`
- `scroll`
- `wait`
- `type_text`

Important input options:

- `steps`
- `default_delay_ms`
- `abort_on_error`
- `cleanup_stuck_inputs`
- `clamp_to_screen`
- `dry_run`

Structured response fields:

- `success`
- `executed_steps`
- `total_steps`
- `failed_step_index`
- `warnings`
- `cleanup`
- `normalized_steps`
- `dry_run`

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

Example hold-`w` while moving:

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

Example dry run:

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

## App And Clipboard Tools

- `launch_app`
- `open_url`
- `read_clipboard`
- `write_clipboard`

`launch_app` is policy-gated and restricted by the configured allowlist.

## Accessibility Tools

### `get_accessibility_tree`

Returns a structured accessibility snapshot when the optional AT-SPI backend is available.

### `find_semantic_targets`

Returns matching accessibility nodes for a semantic query. This is the initial semantic targeting layer and is currently inspection/search only.
