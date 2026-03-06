# Agent Guidelines

## Directory Structure
- `src/main.ts` -> Obsidian plugin entrypoint and lifecycle management.
- `src/MetadataDumper.ts` -> Core business logic for dumping metadata, separated to adhere to the Single Responsibility Principle.
- `src/types.ts` -> Centralized interface definitions.
- `src/errorReporter.ts` -> Centralized error reporting utility.
- `rollup.config.mjs` -> Rollup bundler configuration, using `src/main.ts` as input and outputting to `dist/main.js` which is then copied to the root.

## Error Handling
- **Centralized Error Reporting:** The project uses a centralized error reporting function `reportError` located in `src/errorReporter.ts`. All unexpected errors MUST funnel through this function. Never call `console.error` directly at the call site, and never leave an empty catch block.

## Building and Verification
- The project is built using Rollup via `npm run build`.
- The build outputs compiled files to `dist/` and copies `main.js` to the root directory for Obsidian to use.
