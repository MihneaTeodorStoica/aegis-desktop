# Development

## Prerequisites

- Node.js 20+
- recommended Linux desktop binaries for local testing

## Commands

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke
```

## Development Notes

- logs must never go to stdout
- keep command execution centralized in `src/utils/exec.ts`
- keep tool handlers thin
- add tests when extending validation, matching, or command construction
- do not fake unavailable desktop capabilities

## Testing Strategy

Current tests focus on:

- config parsing
- policy behavior
- title matching
- wmctrl output parsing
- input sequence normalization and cleanup behavior

Follow-up work should add more backend command-construction tests and transport-level smoke coverage.
