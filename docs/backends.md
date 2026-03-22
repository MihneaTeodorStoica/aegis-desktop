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

### Screenshot Backend

Implementation:

- `src/backends/screenshot/linuxScreenshotBackend.ts`

Strategy:

- select backend by preference and availability
- supported CLI candidates:
  - `maim`
  - `import`
  - `gnome-screenshot`

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

## Capability Detection

`src/backends/detect.ts` performs capability detection at startup and surfaces the results through:

- `get_system_info`
- `list_capabilities`
- `health_check`

This makes degraded environments visible to callers instead of causing confusing failures later.

## Wayland Notes

Wayland support is not faked in v1. The architecture is ready for future Wayland backends, but current X11-style synthetic input and window semantics do not automatically carry over.
