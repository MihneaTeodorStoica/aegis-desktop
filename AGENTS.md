# Repository Guidelines

## Project Structure & Module Organization
- `src/` hosts the MCP server, backend adapters, policy, tool registration, and shared utilities. Subdirectories mirror the layers described in `docs/architecture.md` (e.g., `src/backends/`, `src/server/`, `src/policy/`).
- `docs/` holds design notes, architecture, backends, configuration, and roadmap references. Consult it before expanding large areas.
- `tests/` contains unit tests (Vitest) that exercise tools, policies, and backend helpers. `examples/` and `scripts/` showcase integration workflows and automation helpers.
- Release-ready artifacts live under `dist/`, and runtime assets like screenshots are stored via the configured `AEGIS_ARTIFACT_DIR` when running the server locally.

## Build, Test, and Development Commands
- `npm run dev`: runs the dev server with watches for quick iteration on tools and backends.
- `npm run lint`: enforces ESLint rules defined in `eslint.config.js` across `src/`, `tests/`, and tooling scripts.
- `npm run typecheck`: validates TypeScript types before merges.
- `npm test`: executes the Vitest suite under `tests/`.
- `npm run build`: emits the production `dist/` bundle.
- `npm run smoke`: runs the lightweight smoke script for sanity checks after local changes.

## Coding Style & Naming Conventions
- Follow strict TypeScript with explicit exports, minimal `any`, and functional-style helpers when possible. Keep files under `src/` consistent with the layered architecture (e.g., `src/input-sequence/` for input modeling).
- Indent with two spaces. Use Prettier defaults from `prettier.config.js`; run `npm run lint -- --fix` when formatting drift occurs.
- Name runtime backends after their capability (e.g., `X11WindowBackend`). Keep server entry points under `src/server/` and configuration helpers under `src/config/`.

## Testing Guidelines
- The project uses Vitest; tests live in `tests/` and mirror the `src/` layout (`tests/tools`, `tests/backends`, etc.).
- Prefer descriptive test names: `describe('performInputSequence')` and `it('releases modifiers on failure')`.
- Run `npm test` before opening PRs and include coverage anecdotes in the PR description if you modified core tooling.

## Desktop guidance

- Use the [aegis-desktop skill](.codex/skills/aegis-desktop/SKILL.md) whenever the request targets graphical desktop control: switch virtual workspaces, inspect or capture the screen, manage windows, launch allowed desktop apps/URLs, or send explicit mouse/keyboard input.
- Treat those requests as local MCP-execution tasks, not web research tasks.
- Prefer structured MCP tools over keystroke macros to keep actions deterministic.
- For explicit, reversible desktop actions, execute directly without an extra confirmation prompt unless the request is ambiguous, destructive, or security-sensitive.
- For coordinate-dependent UI tasks such as dragging from a sidebar or placing content in part of a window, require visual or semantic grounding before sending input.
- Prefer accessibility inspection first, then active-window screenshots if needed; avoid repeated fullscreen screenshots, especially when `gnome-screenshot` is the active backend.
- If the request names a desktop app first, interpret subsequent actions as UI actions in that app unless the user explicitly asks for filesystem or repository search.

## Commit & Pull Request Guidelines
- Follow the existing git history style: short imperative summary (e.g., `Add safe-mode policy checks`).
- Preserve the required commit trailer: append `Co-authored-by: Codex <noreply@openai.com>` to each commit message body if it is not already present.
- PRs should list the main change, mention related issues, and note verification steps (lint, typecheck, tests, smoke). Include screenshots/logs for tooling changes that affect observable behavior.
