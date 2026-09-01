# NFR Requirements Plan — Unit 1: Core Engine & Storage

This is where the tech stack gets decided once for the whole app (per `execution-plan.md`), not just Unit 1.

## Plan

- [ ] Generate `nfr-requirements.md`
- [ ] Generate `tech-stack-decisions.md`

## Category Evaluation

- **Scalability**: N/A — single local user, at most a few thousand `ExpenseEntry` records over realistic use; no scaling triggers apply.
- **Performance**: N/A as a distinct requirement — all `PlanEngine` operations are simple arithmetic over small arrays (four categories, a bounded entry list); no benchmark target needed, will be sub-millisecond by construction.
- **Availability**: N/A — client-side logic runs in-browser; the only "availability" concern is the advice proxy being reachable, already covered by FR-5's graceful-degradation requirement.
- **Security**: covered by FR-5 (key never in browser) and backlogged Security Baseline extension (NFR-5). One local decision below (server bind address).
- **Reliability**: covered in `business-rules.md` (storage adapter never throws). Testing strategy below.
- **Maintainability**: tech stack + testing tooling below.
- **Usability**: covered by NFR-1 (mobile-first) in requirements.md — not a Unit 1 concern (no UI here).

## Questions (recommended answers pre-filled — please review)

### Question 1: Package manager
A) npm — ships with Node, zero extra install, simplest for a time-boxed solo project

B) pnpm

C) yarn

D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2: React / dependency versioning strategy
A) Use latest stable versions of React, Vite, TypeScript, Express, `@google/genai`, Vitest, and `fast-check` at install time (caret ranges in `package.json`) — no version pinned in the design doc itself, avoids the design going stale

B) Pin exact versions now, specified in this document

C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3: Linting
A) TypeScript `strict: true` only — no separate ESLint/Prettier setup; the compiler is the quality gate, saves setup time for the 3.5h box

B) ESLint + Prettier configured

C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4: Node version target
A) Current Node LTS at build time (no exact version pinned here; documented as "LTS" in `.nvmrc`/README rather than a hardcoded number that may already be stale)

B) A specific version, specified in this document

C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5: Server bind address (local dev security default)
The Express advice proxy — should it bind to localhost only or all interfaces?

A) `127.0.0.1` (localhost only) — this is a local dev tool, no reason to expose it on the network

B) `0.0.0.0` (all interfaces) — needed if testing from a phone on the same LAN

C) Other (please describe after [Answer]: tag below)

[Answer]: A
