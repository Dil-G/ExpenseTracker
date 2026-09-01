# Code Generation Plan — Unit 1: Core Engine & Storage

**Source of truth for this unit's generation.** Workspace root: `C:\ExpenseTracker` (from `aidlc-state.md`). Greenfield, single-unit-so-far project structure: `src/`, `tests colocated with source (*.test.ts)`.

**Requirements covered** (per `unit-of-work-story-map.md`): FR-2, FR-4, NFR-2, NFR-4 (partial). No API layer, no frontend components, no DB migrations — this unit is pure in-process logic + browser storage.

## Steps

- [x] **Step 1 — Project Structure Setup (greenfield, whole-repo scope)**
  - `package.json` — full dependency list per `tech-stack-decisions.md` (client + server deps, since only one package.json exists — Unit 2 will add scripts/imports but not new deps)
  - `tsconfig.json` (strict: true), `tsconfig.node.json` for Vite config
  - `vite.config.ts`, `vitest.config.ts` (or merged into vite.config.ts)
  - `.gitignore` (node_modules, dist, .env)
  - `.env.example` (`GEMINI_API_KEY`, `GEMINI_MODEL`, `PORT`)
  - Empty placeholder dirs for Unit 2 (`src/app/`, `server/`) — not populated this pass

- [x] **Step 2 — Business Logic Generation**
  - `src/core/types.ts` — all domain types from `domain-entities.md`
  - `src/core/planEngine.ts` — all functions from `component-methods.md` / `business-logic-model.md`

- [x] **Step 3 — Business Logic Unit Testing**
  - `src/core/planEngine.test.ts` — example-based tests covering `business-rules.md` edge cases (infeasible plan, zero goal, live daily allowance, cycle boundary clamping, mid-cycle edit behavior)
  - `src/core/planEngine.pbt.test.ts` — property-based tests (`fast-check`), PBT-03 invariants: category allowances sum to discretionary budget, allowances never negative, `remainingDays >= 1`

- [x] **Step 4 — Repository (Storage) Layer Generation**
  - `src/core/storage/storagePort.ts` — interface only
  - `src/core/storage/localStorageAdapter.ts` — implementation

- [x] **Step 5 — Repository Layer Unit Testing**
  - `src/core/storage/localStorageAdapter.test.ts` — example-based (missing/corrupt data → safe defaults)
  - `src/core/storage/localStorageAdapter.pbt.test.ts` — PBT-02 round-trip property (`read(write(x)) === x`)

- [x] **Step 6 — Documentation Generation**
  - `aidlc-docs/construction/unit-1-core-engine-storage/code/code-summary.md` — files created, how to run tests, coverage of FR-2/FR-4/NFR-2/NFR-4

**No** API layer, frontend components, DB migration, or deployment artifact steps — not applicable to this unit (Unit 1 has no API, no UI, no DB, and isn't independently deployed).
