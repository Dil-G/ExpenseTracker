# Code Summary — Change Request 2

Implemented directly against the approved `change-request-2-requirements.md` (skipped a separate Application Design/Units Generation ceremony given this is iterative work on an existing, well-understood codebase — verified continuously with typecheck/tests/build instead).

## Core Engine (`src/core/`)

**Types rewritten**: `Category` (open, replaces `CategoryId` union), `Goal` (target amount + date), `SavingsLedgerState` (persisted banked total), `RecurringPayment`, `CategorySpendMap` (replaces `AllowanceBreakdown`/`CategoryWeights`, both deleted).

**`planEngine.ts`**:
- `computeCategoryMonthlyAllowances` / `computeAllowanceBreakdown` — deleted (Q2=C: no per-category budgeting left).
- `computeRequiredMonthlyPace(targetAmount, bankedTotal, targetDate, asOf)` — new. Derives the monthly savings figure that feeds `computeDiscretionaryBudget`/`computeFeasibility` (same functions, same shape, just fed a derived number instead of a manually-entered one).
- `updateSavingsLedger(...)` — new. Walks forward cycle-by-cycle banking completed cycles into a running total. **Found and fixed a real double-banking bug** during testing: the resume cursor was starting *at* the last-banked cycle instead of the one after it, so calling it twice within the same cycle re-banked the same cycle's savings twice. Fixed and covered by an idempotency test.
- `computeProgress` — reworked around `totalSavedSoFar = bankedTotal + thisCycleEffectiveSavings` and `requiredMonthlyPace` instead of a flat `savingsGoal`.

**Migration**: `LocalStorageAdapter.getCategories()` seeds `DEFAULT_CATEGORIES` (ids `food`/`transport`/`entertainment`/`other`, matching the old fixed values) on first-ever read. Existing `ExpenseEntry.category` strings keep resolving with zero data transform.

## App Layer (`src/app/`)

**New services**: `categoryService.ts` (add/rename/delete with the "blocked if transactions reference it" rule), `recurringService.ts` (CRUD + `processRecurringPayments`, which auto-logs due payments as `ExpenseEntry` on app load — same "check on open" pattern as the existing weekly-advice check, no scheduler).

**`AppProvider.tsx`**: rewritten. Loads categories/goal/ledger/recurring payments alongside the original state; runs recurring-payment processing and savings-ledger refresh once on mount, before first render of derived values.

**Navigation**: 4 tabs (Overview, Transactions, Recurring, Settings), replacing the old 3 (Today, Progress, Advice) + gear-icon-reopens-wizard pattern.
- **`FirstRunWizard.tsx`** (replaces `SetupWizard.tsx`) — first-run only now, 2 steps (Income+Cycle+Currency, Fixed Expenses), no weights step, no goal step (goal is optional, set later in Settings).
- **`App.tsx` `OverviewTab`** — daily/monthly toggle. Daily = today's total spend only (no allowance to compare against, per Q2). Monthly = cycle spend vs. flat budget, `CategoryBreakdown` (spend/totalIncome visibility rows, no limits), `ProgressPanel` (goal progress, reworked for the ledger). `AdvicePanel` renders below in both modes.
- **`TransactionsTab.tsx`** (new) — full history, filter by category/date range, inline edit and delete (didn't exist in any form before this).
- **`RecurringTab.tsx`** (new) — add/list/delete recurring payments.
- **`SettingsTab.tsx`** (new) — Setup, Goal, and Categories management as three sections on one screen.

## Bugs found and fixed during this change
1. **`updateSavingsLedger` double-banking** (engine) — see above.
2. **CSS: stale `.category-breakdown li { display: flex }` rule** from the pre-CR2 single-row category layout fought the new two-row (header + spend bar) layout, cramming category name and amount together with no gap. Removed the stale rule.
3. **CSS: goal target date overflow** — `.progress-goal-note` had `white-space: nowrap`, fine for the old short "of 800.00 goal" text but overflowed the card with the new longer "of 50,000.00 by 2028-09-01" text. Switched to wrapping.
4. **Em-dash audit** — found and fixed 4 stray em-dashes in newly-written component copy (violates the house style adopted during the earlier redesign pass).

## Verification
```
npm run typecheck  -> clean
npm run test       -> 9 files, 55 tests, all passing
npm run build      -> succeeds (~226KB JS / 69KB gzip, ~12KB CSS / 3KB gzip)
```
Manually verified in-browser: infeasibility banner, daily/monthly toggle, category spend visibility rows with mini bars, goal progress card (day label, pace badge, stat grid, miss warning), transactions list + inline edit, recurring payment add + auto-log-to-transactions (confirmed a seeded Netflix payment auto-logged and appeared in Transactions with a "Recurring: Netflix" note), Settings (Setup/Goal sections pre-filled and editable).
