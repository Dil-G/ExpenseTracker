# Business Rules — Unit 2: Web App & Advice Proxy

## Form Validation (client-side, before calling into Unit 1 / `StoragePort`)

| Field | Rule | Error message shown |
|---|---|---|
| Monthly income | number, `>= 0`, required | "Enter an income of 0 or more" |
| Savings goal | number, `>= 0`, required | "Enter a goal of 0 or more" |
| Cycle start day | integer, `1-28`, required | "Pick a day between 1 and 28" |
| Currency | non-empty | "Enter a currency (e.g. USD, LKR)" |
| Fixed expense name | non-empty | "Give this expense a name" |
| Fixed expense amount | number, `>= 0` | "Enter an amount of 0 or more" |
| Category weights (4 fields) | each `0-100`; **live running sum shown**, "Finish Setup" disabled until sum === 100 | "Weights must add up to 100% (currently {sum}%)" |
| Expense amount | number, `> 0`, required | "Enter an amount greater than 0" |
| Expense category | one of the 4 known categories, required | (not user-facing — always pre-selected) |
| Expense date | valid date, required; past and future dates both allowed | "Pick a valid date" |

All rules mirror Unit 1's `business-rules.md` validation table — Unit 2 enforces them at the form boundary (so the user gets immediate feedback) before calling `StoragePort`, which is Unit 1's last line of defense, not the primary one.

## Error State Rules

1. **AI failure never blocks tracking** — a failed/errored `AdviceOrchestrationService.requestAdvice()` only affects the Advice tab's own state (`status: 'error'`); `Today`/`Progress` tabs are unaffected and keep working off `StoragePort`/`PlanEngine` alone (requirements.md FR-5 graceful degradation).
2. **Failed weekly auto-fetch is silent** — no error banner interrupts the user for a background weekly check; the error only shows if they navigate to the Advice tab and see `status: 'error'` there. A failed weekly fetch does not update `lastAdviceFetchAt`, so it retries on next load rather than waiting a further 7 days (business-logic-model.md).
3. **Manual fetch failure is visible** — if the user explicitly taps "Get Advice" and it fails, the error + Retry button show immediately on the Advice tab (they're already looking at it).
4. **Server never leaks raw error detail** — `/api/advice` always returns a generic `{ error: "Advice temporarily unavailable" }` on any Gemini/SDK failure; the raw error is only logged server-side, never sent to the client (avoids leaking API internals/keys in error text).
5. **Infeasible plan takes display priority** — when `feasibility.feasible === false`, the `InfeasibilityBanner` renders above the Today tab's other sections (per plan Q4); the category breakdown still renders below it (all-zero allowances, per Unit 1 Q4), it's just not the first thing the user sees.

## Server Request Validation (`/api/advice`)

The route validates the incoming body has the shape of `AdviceRequestPayload` (all required numeric fields present and finite, `feasibility`/`categoryAllowances`/`progress` objects present) before calling `GeminiAdviceService`. A malformed body (e.g. missing `income`) is rejected with `400` before any Gemini call is made — never spend an API call on a request that's already known to be invalid.
