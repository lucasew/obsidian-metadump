# Agent Guidelines

## Conventions

- **Mise First**: `mise` is non-negotiable for all task execution.
- **Centralized Error Reporting**: All unexpected errors must be funneled through `src/errorReporter.ts`.
- **Directory Structure**: Source code belongs in `src/`.
- **Single Responsibility Principle**: Ensure each class/module handles a single responsibility (e.g. separate business logic like metadata generation from the Obsidian plugin UI/lifecycle).

## Where To Find Things
- `main.ts` -> Plugin entrypoint and lifecycle events.
- `src/MetadataDumper.ts` -> Core logic for metadata processing and chunking.
- `src/errorReporter.ts` -> Centralized error reporting for the plugin.
- `rollup.config.mjs` -> Plugin build configuration.
- `.github/workflows/` -> CI / CD pipelines.
