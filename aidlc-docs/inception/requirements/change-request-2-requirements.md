# Change Request 2 — Requirements

Supersedes the relevant parts of `requirements.md` (original build). This is the authoritative spec for CR2. Original FR/NFR numbers are referenced where replaced.

## Summary of what's changing

- Categories become user-defined, not a fixed 4-value enum.
- The per-category rollover/daily-allowance mechanic is **removed entirely** (Q2=C — deliberate, confirmed reversal of the original app's namesake mechanic). Budget becomes one flat monthly number; categories are spend-visibility only.
- Savings goal becomes a target amount + target date (any duration, not monthly), tracked via a persisted running ledger across cycles.
- Recurring payments: new auto-logging entity, distinct from Fixed Expenses.
- Transactions get full history + edit/delete (previously add-only, no edit/delete existed anywhere).
- Navigation becomes 4 tabs: Overview, Transactions, Recurring, Settings.

## Domain Model Changes

### Category (new, replaces the `CategoryId` union type)
```ts
interface Category {
  id: string;
  name: string;
}
```
**Migration**: seed default categories with `id` equal to the old fixed values (`'food'`, `'transport'`, `'entertainment'`, `'other'`) and matching display names, on first load if no categories are stored yet. Existing `ExpenseEntry.category` string values keep resolving correctly with zero data transform — this is the migration.

### Goal (replaces flat monthly `savingsGoal` in `PlanConfig`)
```ts
interface Goal {
  targetAmount: number;
  targetDate: string;  // ISO date
  startDate: string;   // ISO date, set when the goal is created or edited
}
```

### Savings ledger (new, persisted via `StoragePort` — Q1=A)
```ts
interface SavingsLedgerState {
  bankedTotal: number;         // sum of effective savings from all completed cycles since goal start
  lastBankedCycleStart: string | null; // ISO date of the last cycle whose savings were banked
}
```
On app load: if the current cycle's `start` differs from `lastBankedCycleStart`, bank the *previous* cycle's effective savings into `bankedTotal` and advance the marker. (First run after a goal is created has nothing to bank yet — marker initializes to the goal's `startDate` cycle.)

Derived, not stored:
```
remainingAmount = max(targetAmount - (bankedTotal + currentCycleEffectiveSavings), 0)
monthsRemaining = max(1, monthsBetween(today, targetDate))
requiredMonthlyPace = remainingAmount / monthsRemaining
```
`requiredMonthlyPace` feeds the existing `discretionaryBudget = income - fixedExpensesTotal - requiredMonthlyPace` formula — the engine's core arithmetic shape doesn't change, only where the "monthly goal" number comes from (derived, not entered).

### RecurringPayment (new, distinct from FixedExpenseItem — Q4=A)
```ts
interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  dueDay: number;      // 1-28
  categoryId: string;
  lastAutoLoggedCycleStart: string | null;
}
```
On app load, for each recurring payment: if today's day-of-month ≥ `dueDay` and `lastAutoLoggedCycleStart` ≠ current cycle's start, auto-create an `ExpenseEntry` (amount, categoryId, date=today, note="Recurring: {name}") and advance the marker. Counts as normal category spend — unlike Fixed Expenses, which stay subtracted before the discretionary pool and are never logged as transactions.

### Removed
- `CategoryWeights` type and the weight-sum-to-100 validation.
- `computeCategoryMonthlyAllowances`, per-category fields of `AllowanceBreakdown` (`monthlyAllowance`, `dailyAllowance`, per-category `remainingBudget`) — collapses to one flat number.
- Setup Wizard step 3 (category weights).
- "Near limit / over limit" per-category warnings (no limit exists anymore to be near).

## Functional Requirements (new/changed)

**FR-1 (replaces original FR-1, Setup)**: income, cycle start day, currency, goal (target amount + target date). No category weights. Category list managed separately in Settings, not part of first-run Setup.

**FR-2 (replaces original FR-2, engine)**: `discretionaryBudget = income - fixedExpensesTotal - requiredMonthlyPace` (requiredMonthlyPace derived from the goal ledger, see above). Feasibility check unchanged in shape (shortfall/largest-feasible-goal), now computed against `requiredMonthlyPace` instead of a manually-entered monthly goal. No per-category allowance split — budget is one number.

**FR-3 (categories, new)**: Settings screen — add, rename categories freely; delete blocked if any `ExpenseEntry` references that category (Q3=A) — must reassign/delete those transactions first.

**FR-4 (recurring payments, new)**: own tab. Add/edit/delete recurring payments. Auto-logging behavior per domain model above (Q4=A).

**FR-5 (transactions, new)**: own tab. List all entries, filterable by category and date range. Edit (amount/category/date/note) and delete any entry (Q5=A) — this is genuinely new UI; no edit/delete existed anywhere before.

**FR-6 (Overview, replaces original FR-3/FR-4, merges Today+Progress)**: single tab, Daily/Monthly toggle (Q7=A).
- **Daily**: today's total spend (sum across all categories). No allowance comparison — there's no daily allowance left to compare against.
- **Monthly**: cycle-to-date total spend vs. `discretionaryBudget` (flat), category rows as `spentThisCycle / totalIncome` (visibility ratio, no bar/limit), goal progress (`bankedTotal + currentCycleEffectiveSavings` vs `targetAmount`, % reached, `requiredMonthlyPace`, projection/on-track flag — same shape as the existing Progress page, fed by the new ledger).
- **Advice section**: renders below the toggle in both views, unaffected by which is selected (Q2 of the original app already covers manual+weekly trigger — unchanged, just relocated from its own tab into this one).

**FR-7 (Settings, new)**: Setup fields (FR-1) + Goal editing + Categories management (FR-3). Replaces the gear-icon "reopen wizard" entry point.

## Navigation (Q6=B)
4 tabs: **Overview** | **Transactions** | **Recurring** | **Settings**.

## Out of scope for this change request
- Per-category budgets/limits are gone; re-adding them later (if ever wanted) is a new, separate change — not attempted here.
- No data export/import, no multi-goal support (one active goal at a time), no category icons/colors.
