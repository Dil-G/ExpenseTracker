# Code Summary — Unit 1: Core Engine & Storage

## Files Created

**Whole-repo scaffolding** (Step 1):
- `package.json`, `tsconfig.json`, `vite.config.ts` (vitest config merged in)
- `.gitignore`, `.env.example`
- Empty `src/app/`, `server/` placeholders for Unit 2

**Business logic** (Step 2):
- `src/core/types.ts` — all domain types (`PlanConfig`, `CategoryWeights`, `FixedExpenseItem`, `ExpenseEntry`, `CycleWindow`, `FeasibilityResult`, `AllowanceBreakdown`, `ProgressResult`, plus `AdviceRequestPayload`/`AdviceResponse` for Unit 2 to consume)
- `src/core/dateUtils.ts` — local-date helpers (deliberately not UTC, to match "device's local date")
- `src/core/planEngine.ts` — `computeDiscretionaryBudget`, `computeFeasibility`, `computeCategoryMonthlyAllowances`, `getCycleWindow`, `computeSpendAggregates`, `computeAllowanceBreakdown`, `computeProgress`

**Tests** (Steps 3 & 5):
- `src/core/planEngine.test.ts` — example-based, covers all `business-rules.md` edge cases
- `src/core/planEngine.pbt.test.ts` — PBT-03 invariants (allowances sum to budget, never negative, cycle window bounds)
- `src/core/testGenerators.ts` — shared fast-check domain generators (PBT-07)
- `src/core/storage/localStorageAdapter.test.ts` — example-based (missing/corrupt data handling)
- `src/core/storage/localStorageAdapter.pbt.test.ts` — PBT-02 round-trip properties

**Storage** (Step 4):
- `src/core/storage/storagePort.ts` — `StoragePort` interface
- `src/core/storage/localStorageAdapter.ts` — `LocalStorageAdapter` implementation

## Deviations from the design docs
- `component-methods.md` sketched `PlanService`-style hooks (`useCurrentPlan`) as part of Unit 1's method list; those are actually Unit 2 (React) concerns — Unit 1 only exposes the plain-function `PlanEngine` API. No functional gap, just a layer correction.
- Found and fixed a logic bug during Functional Design write-up (see `audit.md`, 2026-09-01T01:10:00Z): `largestFeasibleGoal`/`shortfall` are computed unconditionally via `max()`/floor rather than branching on feasibility — implemented that way in `computeFeasibility`.
- **TypeScript pinned to `^5.9.3`, not the new `7.0.2` major** — `tech-stack-decisions.md` said "latest stable, no pinning," and 7.x is genuinely the current stable dist-tag, but it's a very recent rewrite (Go-based compiler) with real ecosystem-compatibility risk. Deliberately stayed on the well-trodden 5.x line to avoid burning the time-box on a migration not asked for. Flagging in case you want 7.x anyway.
- **Everything else in `tech-stack-decisions.md` needed real version numbers resolved via `npm view <pkg> version`**, not hand-picked — my first pass guessed versions from training data (vitest 2.x, vite 5.x, React 18.x, jsdom) that turned out stale for this timeline; actual resolved majors are much newer (React 19, Express 5, vite 8, vitest 4, `@google/genai` 2.20). `package.json` now reflects the real versions.

## Two real bugs found and fixed while getting the test suite green (both worth knowing about)
1. **Test environment**: with Node's newer built-in "experimental webstorage" feature, `globalThis.localStorage` exists natively before Vitest's jsdom/happy-dom environment even starts — and Vitest's `populateGlobal` only overrides a global key with the environment's version if that key is either absent or in a small hardcoded allowlist (`localStorage`/`sessionStorage` aren't in it). Net effect: tests got Node's non-functional native `localStorage` stub instead of happy-dom's working one, regardless of which DOM environment or version was configured. Fixed by disabling that Node feature for test runs: `test`/`test:watch` scripts now run via `cross-env NODE_OPTIONS=--no-experimental-webstorage` (added `cross-env` as a dependency for Windows/cross-platform env-var support). This is an environment/tooling fix, not an application bug.
2. **Real PBT-caught bug** (this one's the kind of thing PBT-03 exists for): `genToday()` in `testGenerators.ts` used `fc.date({min, max})` without `noInvalidDate: true`, so fast-check occasionally generated an Invalid Date (`NaN`), which broke `getCycleWindow`'s date arithmetic. Fixed the generator, not the engine — this was a test-generator quality gap (PBT-07), not a `PlanEngine` defect.

## Verification
```
npm run typecheck   -> clean, 0 errors
npm run test        -> 4 test files, 31 tests, all passing
```

## How to Run
```bash
npm install
npm run test        # runs both example-based and PBT suites once
npm run test:watch  # watch mode
npm run typecheck
```

## Requirement Coverage
- **FR-2** (deterministic engine): `computeDiscretionaryBudget`, `computeFeasibility`, `computeCategoryMonthlyAllowances`, `getCycleWindow`, `computeAllowanceBreakdown` — fully implemented and tested.
- **FR-4** (progress): `computeProgress` — fully implemented and tested.
- **NFR-2** (storage abstraction, open category model): `StoragePort`/`LocalStorageAdapter` is the only persistence seam; `CategoryId` is a union type.
- **NFR-4** (testing, partial PBT): example tests + PBT-02/03 property tests in place; PBT-07/08/09 satisfied by generator design and fast-check defaults (see test file header comments).
