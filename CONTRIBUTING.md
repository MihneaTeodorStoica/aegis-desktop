# Contributing

## Development workflow

1. Install Node.js 20+ and optional desktop binaries listed in the README.
2. Run `npm install`.
3. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before opening a pull request.

## Coding standards

- Keep transport, tool registration, policy, config, and backend logic separate.
- Do not write logs to stdout. Use the shared logger, which writes to stderr.
- Keep backends honest about support levels. Do not fake Wayland support.
- Add tests for validation, matching, policy behavior, and command construction when extending tools.

## Commit messages

Use clear, imperative commit messages and include rationale in the body for behavior changes.
