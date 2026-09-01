# Application Design Plan — Rollover

## Design Plan (checkboxes tracked during execution)

- [ ] Generate `components.md` — component definitions & responsibilities
- [ ] Generate `component-methods.md` — method signatures per component
- [ ] Generate `services.md` — service definitions & orchestration
- [ ] Generate `component-dependency.md` — dependency matrix & data flow
- [ ] Generate `application-design.md` — consolidated doc
- [ ] Validate design completeness & consistency

## Design Decisions (please review/edit — recommended defaults pre-filled)

### Question 1: Frontend state management
How should React state be wired to the engine/storage layer?

A) React Context + hooks only — no extra dependency, one `AppProvider` exposing plan/tracking/advice state (leanest, fits time-box)

B) A dedicated state library (Zustand/Redux/Jotai)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2: Server framework for the advice proxy
What should the minimal server-side endpoint run on?

A) Express (Node) — one route, `POST /api/advice`, minimal middleware, most common/well-documented choice

B) Plain Node `http` module, no framework

C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3: Repository/folder layout
How should client and server code be organized in this single repo?

A) Single `package.json`, two folders: `src/` (Vite React client) and `server/` (Express proxy), run concurrently in dev via two npm scripts — simplest, no workspace tooling

B) npm workspaces with separate `packages/client` and `packages/server`

C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4: Discretionary category allocation rule
Requirements (FR-2) left the split-across-categories rule open, to finalize here. How should the discretionary budget be divided across food / transport / entertainment / other?

A) Equal split — `discretionaryBudget / 4` per category (simplest, transparent, matches standard depth; user can't yet customize weights in this build)

B) Fixed default weights (e.g. food 40%, transport 25%, entertainment 15%, other 20%) baked in

C) User-configurable weights entered during Setup (adds a setup field + validation that weights sum to 100%)

D) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 5: Code organization style
How should the codebase group files?

A) Layer-based: `src/core/` (types, plan engine, storage port + adapter), `src/app/` (React UI, hooks), `server/` (Express + Gemini client) — matches the Unit 1/Unit 2 split directly

B) Feature-based: folders per feature (setup, tracking, progress, advice) each containing their own components/logic

C) Other (please describe after [Answer]: tag below)

[Answer]: A
