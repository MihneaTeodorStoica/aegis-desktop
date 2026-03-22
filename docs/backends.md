# Backends

## Philosophy

Backends are responsible for turning high-level tool requests into OS-level operations. Tool handlers should not shell out directly.

## Current Backend Matrix

### Window Backend

Implementation:

- `src/backends/windows/x11WindowBackend.ts`

Strategy:

- list windows with `wmctrl -lx`
- resolve active window with `xdotool getactivewindow`
- fetch geometry with `xwininfo`
- focus, move, resize, and close with `wmctrl`

### Input Backend

Implementation:

- `src/backends/input/x11InputBackend.ts`

Strategy:

- primitives implemented with `xdotool`
- low-level stateful operations: `keyDown`, `keyUp`, `mouseDown`, `mouseUp`, `mouseMove`
- high-level helpers built on those primitives

Wayland implementation:

- `src/backends/input/waylandInputBackend.ts`
- partial support via `ydotool`
- unsupported operations fail explicitly rather than pretending parity with X11

### Screenshot Backend

Implementation:

- `src/backends/screenshot/linuxScreenshotBackend.ts`

Strategy:

- select backend by preference and availability
- supported CLI candidates:
  - `maim`
  - `import`
  - `gnome-screenshot`

Wayland implementation:

- `src/backends/screenshot/waylandScreenshotBackend.ts`
- prefers `grim`
- falls back to `gnome-screenshot` with explicit region limitations
- extracts PNG dimensions after capture

### Monitor Backend

Implementation:

- `src/backends/monitors/linuxMonitorBackend.ts`

Strategy:

- use `xrandr --listmonitors` on X11
- use `wlr-randr` on supported Wayland stacks
- expose geometry and primary-monitor metadata for coordinate routing

### OCR Backend

Implementation:

- `src/backends/ocr/tesseractBackend.ts`

Strategy:

- use `tesseract` when enabled and present
- degrade gracefully when OCR is disabled or unavailable

### Launch Backend

Implementation:

- `src/backends/launch/linuxLauncher.ts`

Strategy:

- launch apps with Node `spawn`
- open URLs through `xdg-open`

### Clipboard Backend

Implementation:

- `src/backends/clipboard/xclipBackend.ts`

Strategy:

- prefer `xclip`
- fall back to `xsel`

Wayland additions:

- prefer `wl-copy` and `wl-paste` when available
- writes are piped through stdin instead of shell interpolation

### Accessibility Backend

Implementation:

- `src/backends/accessibility/pythonAtspiBackend.ts`
- `scripts/accessibility_snapshot.py`

Strategy:

- use Python `pyatspi` when available
- return a structured accessibility snapshot
- support semantic query filtering
- degrade to a no-op backend when unavailable

## Capability Detection

`src/backends/detect.ts` performs capability detection at startup and surfaces the results through:

- `get_system_info`
- `list_capabilities`
- `health_check`

This makes degraded environments visible to callers instead of causing confusing failures later.

## Wayland Notes

Wayland support is no longer a silent X11 assumption. The server now selects explicit Wayland backends and reports unsupported operations honestly where compositor-portable behavior is not yet implemented.
