# Architecture Overview

`aegis-desktop` separates the desktop-control surface into clear, composable layers so each responsibility can evolve independently while staying verifiable.

## Layers

- **Transport and registration.** The MCP stdio server bootstraps the tool catalog, wires them to schemas, and exposes structured MCP descriptors through `src/server/`.
- **Backend abstractions.** Window, screenshot, input, monitor, OCR, launch, clipboard, and accessibility interfaces live in `src/backends/`. Each backend exposes capability detection and declarative methods that the tool layer invokes.
- **Tools.** Tool handlers in `src/tools/` validate inputs with Zod, call policy checks, and delegate to a backend implementation. The defensive schemas and policy gates keep surface interactions predictable.
- **Policy and configuration.** Policy checks in `src/policy/` enforce safe-mode blocking, coordinate validation, rate limiting, and launch allowlists based on typed config defaults.
- **Utilities.** Logging, matching, command execution, and input-sequence helpers keep the implementation DRY while staying testable.

## Backend Strategy

- X11 first: window management via `wmctrl`/`xdotool`, screenshots via `maim`/`import`/`gnome-screenshot`, monitors via `xrandr`, and input via `xdotool`.
- Optional tools (OCR via `tesseract`, Wayland helpers, clipboard workflows) plug behind the same interfaces so capability reporting is honest about what is available.
- Unsupported or partial backends (for example Wayland window control) surface clear errors and capability flags instead of failing silently.

## Extensibility

Additions follow a predictable path: extend the relevant backend interface in `src/backends/types.ts`, implement the backend, expose its detection, add policy checks when needed, and register the tool in `src/server/registerTools.ts`. High-level documentation and tests keep regressions from creeping in.
