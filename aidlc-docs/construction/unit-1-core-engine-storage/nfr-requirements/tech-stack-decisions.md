# Tech Stack Decisions — Rollover (whole app)

Decided once here per `execution-plan.md`; applies to both Unit 1 and Unit 2.

| Concern | Decision | Rationale |
|---|---|---|
| Package manager | npm | Ships with Node, zero extra install (Q1: A) |
| Frontend build | Vite + React + TypeScript | Already required by `requirements.md`; Vite is the standard fast dev server/bundler pairing for this stack |
| Backend runtime | Node.js, current LTS | No exact version pinned in docs — tracked via `.nvmrc`/README so it never goes stale (Q4: A) |
| Backend framework | Express | Application Design Q2 |
| Backend dev runner | `tsx` | Runs TypeScript server code directly without a separate compile step, matches Unit 1's plan for `server/` |
| Language | TypeScript, `strict: true` everywhere | Compiler is the quality gate; no separate linter (Q3: A) |
| Unit testing | Vitest | Vite-native test runner, no extra config to bridge build tool ↔ test runner |
| Property-based testing | `fast-check` | Vitest-compatible, per `requirements.md` NFR-4 (Partial enforcement: PBT-02/03/07/08/09) |
| AI SDK | `@google/genai` | Per `requirements.md` FR-5/NFR-3 (Gemini swap) |
| Versioning strategy | Caret ranges (`^x.y.z`), no versions hardcoded in design docs | Avoids design docs going stale; exact resolved versions will live in `package-lock.json` at generation time (Q2: A) |
| Server bind address | `127.0.0.1` only | Local dev tool, no network exposure needed (Q5: A) |
| Linting/formatting | None (TS strict only) | Time-box; backlog-able later |
| Test env variable | `cross-env NODE_OPTIONS=--no-experimental-webstorage` on `test`/`test:watch` scripts | Works around a Vitest/Node interaction where Node's native experimental webstorage global pre-empts Vitest's DOM environment's `localStorage` (see `code-summary.md` for full explanation) |
| State management (client) | React Context + hooks | Application Design Q1 |
| Persistence | `localStorage` via `StoragePort` abstraction | `requirements.md` NFR-2 |

## Environment Variables (server)
| Var | Purpose | Default |
|---|---|---|
| `GEMINI_API_KEY` | Gemini API authentication | none — required, server fails fast if unset |
| `GEMINI_MODEL` | Model selection | `gemini-2.5-flash` (per `requirements.md` NFR-3) |
| `PORT` | Express server port | `3001` |
