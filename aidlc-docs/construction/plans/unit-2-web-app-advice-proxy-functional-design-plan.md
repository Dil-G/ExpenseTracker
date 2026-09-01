# Functional Design Plan — Unit 2: Web App & Advice Proxy

Lighter than Unit 1 per `execution-plan.md` — the hard math is already built and tested; this stage covers screen/flow structure and the `/api/advice` contract.

## Plan

- [ ] Generate `business-logic-model.md` — request/response contract, weekly-vs-manual trigger flow
- [ ] Generate `business-rules.md` — form validation, error-state rules
- [ ] Generate `domain-entities.md` — request/response shapes (already typed in Unit 1's `types.ts`; this documents how Unit 2 uses them)
- [ ] Generate `frontend-components.md` — component hierarchy, props/state, interaction flows, validation, API integration points

Frontend Components applies (this unit has UI). Integration Points applies (`/api/advice`, Gemini). Error Handling applies (AI failure, validation failure). Business Logic Modeling / Domain Model are light — the real business logic already lives in Unit 1.

## Questions (recommended answers pre-filled — please review)

### Question 1: Screen structure
A) Single scrollable page, sections in order: Today's Spend & Allowance → Category Breakdown (MTD) → Progress → Advice, with a fixed bottom Add button — matches the single-column mobile-first requirement, no routing/tab complexity

B) Tabbed navigation (separate Today / Progress / Advice tabs)

C) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 2: Two-tap add flow — exact taps
A) Tap 1: fixed bottom "+" button opens the Add Expense sheet, pre-filled (amount field focused with numeric keypad, category defaults to last-used, date defaults to today). Tap 2: "Save" button submits with those defaults. Typing the amount isn't a "tap"; changing category/date is optional and adds taps only if the user chooses to

B) Something else (please describe after [Answer]: tag below)

[Answer]: A

### Question 3: Setup form style
A) Single scrollable form — income, goal, cycle start day, currency, fixed expenses (add/remove rows), category weights (sum-to-100% validated inline) — one "Save" action, no multi-step wizard

B) Multi-step wizard across several screens

C) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 4: Infeasible plan — where does the warning go?
A) A banner/alert at the top of the Main screen when `feasibility.feasible === false` (shortfall + largest feasible goal), with the category breakdown section still rendered below it showing all-zero allowances (per Unit 1's Q4 decision) rather than being hidden

B) Replace the whole Main screen with an infeasibility-only view until the plan is fixed

C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5: Advice panel states & labeling
A) Idle (never fetched): "Get Advice" button + neutral placeholder copy. Loading: spinner. Success: structured sections (how to reach goal / categories to trim / first step / tone banner) plus a small "Manual" or "Weekly overview" tag and a timestamp. Error: message + Retry button. The rest of the app (tracking/progress) always renders regardless of advice state

B) Other (please describe after [Answer]: tag below)

[Answer]: A

## Follow-up Questions (Step 8 ambiguity check on Q1/Q3)

Both B answers picked a direction without pinning down the shape, which is a real gap, not a nitpick: "tabbed navigation" doesn't say which tabs or where Setup lives, and "multi-step wizard" doesn't say how many steps or what's on each. Flagging one more thing directly: tabs + a wizard is more UI-state surface than the single-scroll-page option, which matters against your 3.5h time-box — proceeding as answered, but keeping each piece as lean as possible below.

### Question 1a: Tab bar composition
A) 3 tabs — **Today** (spend/allowance + category breakdown + add button), **Progress** (savings goal progress), **Advice** — plus a small settings/gear icon in the header (not a 4th tab) that reopens the Setup wizard for edits. First run (no `PlanConfig` yet) shows the Setup wizard full-screen before any tabs exist

B) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3a: Wizard step breakdown
A) 3 steps: **(1) Income & Goal** — monthly income, savings goal, cycle start day, currency; **(2) Fixed Expenses** — add/remove named items; **(3) Category Weights** — 4 inputs summing to 100%, inline validation, "Finish Setup" button. Editing later re-enters this same 3-step wizard (via the Question 1a settings icon), not a separate edit form

B) Other (please describe after [Answer]: tag below)

[Answer]: A
