# Change Request 2 — Requirements Clarification Questions

Seven asks came in. Most are UI restructuring (clear enough to just build). Four are **structural** — they change data model, engine math, or the app's core mechanic — and need a decision before code, because guessing wrong here means hours of rework later. Flagging which is which.

## Question 1: Multi-month goals — the big one

Today: `savingsGoal` is a flat monthly number, reset every cycle, computed live from the current cycle's entries only. Nothing persists across cycle boundaries — there's no history ledger.

"Reach 500,000 in 6 months" needs: a target amount + a target date (or duration), and **progress accumulated across multiple cycles** — which means either (a) a persisted running "banked savings" total updated at each cycle boundary, or (b) replaying every past cycle's numbers from stored entries on every read (fragile once income/fixed-expenses/categories change over time).

A) **Add a persisted savings ledger.** Goal = `{ targetAmount, targetDate }`. At each cycle boundary (or on app load, if the boundary was crossed since last open), the engine banks that cycle's effective savings into a running total, stored via `StoragePort`. Progress = `bankedTotal + currentCycleEffectiveSavings` vs `targetAmount`, with `requiredMonthlyPace = remainingAmount / monthsRemaining` shown alongside the existing daily-allowance system (monthly `savingsGoal` becomes *derived* from the long-term goal + pace, not manually entered)

B) **Keep it purely projected, no ledger.** Goal = `{ targetAmount, targetDate }`, but progress is just current cycle's effective savings vs. `targetAmount / totalMonths` (a per-month slice) — simpler, no persisted history, but "progress toward 500k" only ever reflects the current month, never actually accumulates

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2: Categories — does removing weights also remove the daily-allowance mechanic?

This is the one that matters most for what "Rollover" *is*. Today, category weights feed the rollover math: `categoryMonthlyAllowance = discretionaryBudget × weight%`, then daily allowance shrinks live as you spend (the app's namesake mechanic).

"Do not need to weight categorize data, but show each as x/total income" reads as: drop the manual weight-input step, and categories become **pure spend visibility** (no budget cap, no allowance, no rollover per category) — just "you've spent 22,000 of your 400,000 income on Food this cycle."

A) **Categories become spend-visibility only.** No per-category allowance, no per-category rollover. Rollover math still applies to the *total* discretionary budget as one pool (one daily allowance number, not four) — the mechanic survives, just collapses from per-category to whole-budget

B) **Keep per-category allowances, drop only the manual weight step.** Split discretionary budget equally across whatever categories exist (`budget / categoryCount`) instead of user-set weights — rollover mechanic stays fully per-category, setup gets simpler

C) Categories are spend-visibility only AND there's no rollover concept left at all — just a flat monthly budget number, spent-so-far, no daily allowance anywhere

D) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 3: Custom categories — editing rules

A) Categories can be renamed/added freely in Settings; **deleting** a category that has existing transactions is blocked (must reassign or delete those transactions first) — keeps history consistent

B) Deleting a category deletes its transactions too (destructive, no confirmation beyond a warning)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4: Recurring payments — what are they, mechanically?

A) A **new entity distinct from Fixed Expenses**: name, amount, day-of-month due, category. On app load, if a recurring payment's due day has passed since last check and it hasn't been logged this cycle, **auto-create an expense entry** for it (same pattern as the existing weekly-advice auto-check) — shows up in Transactions like any other spend, counts against category/budget normally

B) Recurring payments are just a renamed/extended version of the existing Fixed Expenses list (add a `dueDay` field to `FixedExpenseItem`) — no auto-logging, purely informational, doesn't touch discretionary budget math since fixed expenses already aren't part of the discretionary pool

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5: Transactions tab — read-only or editable?

A) Full CRUD — view history (searchable/filterable by category or date), **edit and delete** past entries (currently only "add" exists, no edit/delete UI at all)

B) Read-only list — view history only, no editing (add/delete stays exclusive to the Add Expense sheet flow, which doesn't support delete either today)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 6: Navigation — proposed structure

Net effect of all the asks: merge Today+Progress, remove Advice as a tab, add Transactions, add Settings (categories + recurring live here), keep the existing gear-icon Setup flow folded into Settings too.

A) **3 tabs: Overview | Transactions | Settings.** Overview = daily/monthly toggle + stats + Advice section. Settings = Setup (income/goal/cycle) + Categories (add/rename/delete) + Recurring Payments (add/manage) as sub-sections on one screen, replacing the gear-icon wizard reopen

B) 4 tabs: Overview | Transactions | Recurring | Settings (recurring payments gets its own tab instead of living inside Settings)

C) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 7: Overview toggle — what changes between Daily and Monthly view?

A) **Daily**: today's spend vs. today's rollover allowance (current Today tab content). **Monthly**: cycle-to-date spend, category breakdown, and (if Q1=A) long-term goal progress with the stat grid (current Progress tab content). Advice section renders below the toggle in both views, unaffected by which one is selected

B) Other (please describe after [Answer]: tag below)

[Answer]: A
