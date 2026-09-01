# Functional Design Plan — Unit 1: Core Engine & Storage

## Plan

- [ ] Generate `business-logic-model.md` — algorithms, calculation flow
- [ ] Generate `business-rules.md` — validation, constraints, edge cases
- [ ] Generate `domain-entities.md` — entities, fields, relationships
- [ ] (No `frontend-components.md` — Unit 1 has no UI)
- [ ] Validate against `unit-of-work-story-map.md` requirement coverage

This is the highest-stakes design in the whole build — the rollover math is the one place a wrong assumption is expensive. Business Logic Modeling, Domain Model, Business Rules, Data Flow, and Business Scenarios/edge cases are all directly applicable and covered below. Integration Points, Error Handling (external), and Frontend Components are N/A — Unit 1 is pure in-process logic with no external calls and no UI.

## Questions (recommended answers pre-filled — please review)

### Question 1: Does today's own spend count against today's allowance calculation, or only against remaining allowance?
When computing today's rollover daily allowance, should the "spend so far in category" used in the formula include or exclude today's own entries?

A) Exclude today — `dailyAllowance(today) = (categoryMonthlyAllowance − spendOnPriorDaysInCycle) / remainingDaysIncludingToday`. Today's allowance is fixed for the whole day as of this morning; today's own spend is then tracked separately against it (standard envelope-budget behavior — allowance doesn't shrink as you spend it today, you just see it getting used up)

B) Include today — allowance recalculates live after every expense logged today, shrinking immediately

C) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 2: Savings goal = 0 — how should "% of goal reached" display?
If the user sets `savingsGoal = 0` (dividing by zero otherwise):

A) Show 100% (goal of zero is trivially always met) and skip the on-track/miss projection entirely for that category (there's nothing to miss)

B) Show "N/A — no goal set" and hide the progress bar

C) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3: Cycle start day falls on a date that doesn't exist in the current/next month (e.g. start day 30, February)
How should the cycle window be computed?

A) Clamp to the last valid day of that month (e.g. start day 30 → Feb 28/29) — cycle boundaries shift slightly some months but never throw/skip

B) Always use day 30/31 literally and let the date library normalize (can cause an unexpected 2-day jump into March)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4: Infeasible plan (discretionary budget negative) — what do category allowances show?
When `income − fixedExpenses − savingsGoal < 0`:

A) All category monthly/daily allowances show as 0 (not negative), and the UI leads with the infeasibility warning (shortfall + largest feasible goal) instead of a budget breakdown

B) Allowances show as negative numbers, literally reflecting the deficit split across categories

C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5: Mid-cycle edits to income/goal/fixed expenses/weights
If the user edits Setup values partway through a cycle, should the change apply immediately (recomputing remaining-days allowance with the new numbers) or only from the next cycle?

A) Apply immediately — engine is stateless, always computed live from current config + logged entries; edited numbers affect today's and remaining days' allowance right away (simplest, no history/versioning needed)

B) Queue the change — new values only take effect at the next cycle boundary; requires storing "pending config" separately

C) Other (please describe after [Answer]: tag below)

[Answer]: A
