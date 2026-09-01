# NFR Requirements — Unit 1: Core Engine & Storage

(Also establishes tech stack decisions for the whole app — see `tech-stack-decisions.md`.)

## Scalability
**N/A** — single local user, browser-only storage, at most low-thousands of `ExpenseEntry` records in realistic use. No scaling triggers.

## Performance
No formal benchmark required. `PlanEngine` operations are O(n) over a small entry array and O(1) over the 4 fixed categories — inherently sub-millisecond. Verified informally in Build and Test, not via a dedicated perf test.

## Availability
**N/A** for Unit 1 (runs in-browser, no uptime concept). The advice proxy's availability is addressed by FR-5's mandatory graceful-degradation requirement (already in `requirements.md`), not repeated here.

## Security
- No new attack surface in Unit 1 — pure logic + `localStorage`, no network calls, no secrets handled.
- Express advice proxy (Unit 2, decided here since it's the one process-level security-relevant choice made during this stage): binds to `127.0.0.1` only, not `0.0.0.0` — not reachable from the network, only the local machine. Revisit if LAN/phone testing is needed later (see NFR Requirements Q5 in the plan doc).
- Full Security Baseline extension remains backlogged per `requirements.md` NFR-5.

## Reliability
- `LocalStorageAdapter` never throws to callers — missing/corrupt data resolves to `null`/`[]` (see `business-rules.md` rule 6).
- `PlanEngine` functions are total (defined for all valid typed inputs) — no runtime exceptions expected from valid `PlanConfig`/`ExpenseEntry` data; invalid data is rejected at the validation boundary (`business-rules.md`), not inside the engine.

## Maintainability
- TypeScript `strict: true` across the whole project — compiler is the primary quality gate (Question 3: A).
- Testing: Vitest for example-based unit tests; `fast-check` for the Partial-PBT scope agreed in `requirements.md` NFR-4 (PBT-02, 03, 07, 08, 09) — round-trip (storage), invariants (allowance sums, non-negativity), generator quality, shrinking/reproducibility, framework selection.
- No ESLint/Prettier for this build (Question 3: A) — acceptable given `strict: true` TS and the time-box; flaggable as a backlog item if the project grows past this build.

## Usability
N/A for Unit 1 (no UI). Covered by `requirements.md` NFR-1 for Unit 2.
