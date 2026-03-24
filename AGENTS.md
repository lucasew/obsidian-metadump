# Project Conventions for AI Agents

## General Instructions
* **Mise First:** `mise` is non-negotiable for task execution. Pin `mise` tools to specific versions.
* **Error Handling:** Never ignore errors or leave empty catch blocks. All unexpected errors MUST be funneled through a centralized error-reporting function (e.g., `reportError`), integrating with Sentry if available.
* **Code Structure:**
  * Source code resides in the `src/` directory.
  * `src/main.ts` is the Obsidian plugin entrypoint. It should primarily handle plugin UI/lifecycle events.
  * Follow the Single Responsibility Principle: decoupled business logic (like `MetadataDumper` or `errorReporter.ts`) should be separated into their own modules within `src/`.
* **Testing:** Ensure automated checks pass, then perform a manual sanity check reasoning through runtime behavior. Tests must exercise your actual implementation.
* **Dependency Management:** Never downgrade dependencies unless explicitly requested. Do not commit downloaded binaries, tooling artifacts, or `install-mise.sh`.
* **GitHub Actions:** Restricted to exactly ONE workflow file (`.github/workflows/autorelease.yml`) executing all pipeline steps.

## Build and Tooling
* The project uses **Rollup** for builds (`rollup.config.mjs`). Entrypoint is `src/main.ts`.
* Compiled files output to `dist/`, with `rollup-plugin-copy` moving `main.js` back to the root for Obsidian.
* Build command: `npm run build`
* All linting and formatting MUST use `workspaced` via `mise`. Do not manually install linters.
* All `mise` tasks (`lint`, `fmt`, `test`, `codegen`, `install`, `ci`) should depend ONLY on wildcards if needed.

## PR Conventions
* **Docs Agent:** PR Title must be exactly `📝 Docs: [Description]`. Execution is strictly restricted to documentation (no logic changes). Scope to one cohesive area, max 10 files / 280 lines.
* **Refactor Agent:** PR Title must be exactly `🛠️ Refactor: [Description]`.
* **Sentinel Agent:** Must append a single-line journal entry in `.jules/sentinel.md` formatted as `- YYYY-MM-DD: [the class of issue and how to spot it]`.
* **PR Body:** Every PR MUST include four concise sections: `Assumptions`, `Alternatives Not Chosen`, `How To Pivot`, and `Next Knobs`.

## Git Operations
* Never use `git add -A` or `git add .`. Stage files explicitly using `git add <path>`.

## Discoverability (Where To Find Things)
* `main.ts` -> Obsidian plugin lifecycle and UI integration (currently in root, to be moved to `src/`)
* `rollup.config.mjs` -> Build configuration
* `package.json` -> Dependencies and scripts
