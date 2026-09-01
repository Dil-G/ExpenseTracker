# Business Rules — Unit 1: Core Engine & Storage

## Validation Rules (enforced at write time — `PlanService.saveSetup` / `TrackingService.addExpense`, backed by `PlanEngine` pure validators)

| Field | Rule |
|---|---|
| `monthlyIncome` | number, `>= 0` |
| `savingsGoal` | number, `>= 0` |
| `cycleStartDay` | integer, `1 <= x <= 28` |
| `currency` | non-empty string |
| `categoryWeights.*` | each `0 <= x <= 100`; **sum of all 4 must equal exactly 100** (reject otherwise, surface which category to adjust) |
| `FixedExpenseItem.name` | non-empty string |
| `FixedExpenseItem.amount` | number, `>= 0` |
| `ExpenseEntry.amount` | number, `> 0` (zero/negative rejected — not a meaningful expense) |
| `ExpenseEntry.category` | must be one of the 4 known `CategoryId` values |
| `ExpenseEntry.date` | valid ISO date string; no restriction on past/future (backdating explicitly allowed per FR-3) |
| `ExpenseEntry.note` | optional, no length limit for this build |

## Edge Cases & Decisions (from Functional Design Q&A)

1. **Live daily allowance (Q1: B)** — `dailyAllowance` for a category shrinks in real time as expenses are logged today; there is no "locked at start of day" snapshot. Adding an expense today immediately reduces `remainingBudget` and therefore `dailyAllowance` on the next read.
2. **Zero savings goal (Q2: B)** — `savingsGoal === 0` ⇒ `ProgressResult.hasGoal = false`, `percentOfGoal = null`, `onTrack = null`. UI (Unit 2) is responsible for showing "N/A — no goal set" and hiding the progress bar; the engine's job is only to signal `hasGoal: false`, not to format the message.
3. **Cycle start day clamping (Q3: A)** — a `cycleStartDay` that doesn't exist in a given month (only relevant for values 29-31, which Setup validation already disallows by capping at 28) never triggers this rule in practice for values coming from Setup; the clamp logic still exists in `getCycleWindow` as a defensive floor for any future date-boundary edge case (leap years etc.) rather than something a normal user path hits at `cycleStartDay <= 28`.
4. **Infeasible plan allowances (Q4: A)** — when `feasible === false`, every category's `monthlyAllowance` and `dailyAllowance` is `0`, never negative. `TrackingService`/UI must check `feasibility.feasible` first and lead with the warning (shortfall + largest feasible goal) rather than presenting a misleading all-zero budget breakdown as if it were normal.
5. **Mid-cycle edits (Q5: A)** — no config versioning. Every calculation always reads the *current* `PlanConfig` and *current* `ExpenseEntry[]` — editing income/goal/weights/fixed-expenses immediately changes the next computed allowance. This also means historical days within the same cycle are not "re-explained" — only the forward-looking `remainingBudget / remainingDays` split changes.
6. **Corrupt/missing storage data** — `LocalStorageAdapter` never throws to callers. Missing `PlanConfig` returns `null` (caller routes to `SetupScreen`). Missing/corrupt `FixedExpenseItem[]` / `ExpenseEntry[]` returns `[]`. A `JSON.parse` failure is treated identically to "missing" (log a console warning, do not crash).
7. **Backdated entries and cycle bucketing** — an `ExpenseEntry` belongs to whichever cycle window contains its `date`, not the cycle active when it was created. Logging a backdated expense from a prior cycle does not affect the *current* cycle's allowance calculation (the entry falls outside `cycleWindow.start..end` for "today's" window) — this is a natural consequence of the bucketing rule, not special-cased code.
8. **Rounding** — all internal computation uses full floating-point precision; rounding (2 decimal places) happens only at display time in Unit 2, never inside `PlanEngine`. Storage also persists full precision.

## Requirement Coverage Check (against `unit-of-work-story-map.md`)

- FR-2 (engine): fully covered — feasibility, category allowances, rollover daily allowance, cycle boundary all specified above.
- FR-4 (progress): fully covered — effective savings, % of goal, projection, on-track flag.
- NFR-2 (storage abstraction, open category model): `StoragePort` interface (see `domain-entities.md`) is the only persistence seam; `CategoryId` is a union type, not hardcoded per-field storage, so adding a 5th category later is a type change, not a storage schema migration.
