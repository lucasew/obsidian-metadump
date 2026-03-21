# Agent Guidelines

## Directory Structure
- All source files should reside within the `src/` directory.
- Use a domain-driven approach to grouping files, separating core business logic from Obsidian UI integration.

## Single Responsibility Principle
- Avoid placing logic inside `main.ts` unless it is strictly tied to plugin instantiation or Obsidian app events.
- Business logic (e.g., metadata dumping) should be extracted into dedicated modules or classes (e.g., `MetadataDumper`).

## Error Handling
- Never ignore errors. All unexpected errors must be funneled through a centralized error-reporting function (`reportError` in `src/errorReporter.ts`).
- Avoid "empty catch block" and "throw null" anti-patterns.
- Make sure that catching mechanisms are appropriately logged and handled cleanly.

## Tooling
- `mise` is non-negotiable and must be used for all tasks executing project scripts (`mise run build`, `mise run test`, `mise run ci`).
- Maintain task dependencies using standard `mise.toml`.
