# Requirements — Rollover

## Intent Analysis Summary

- **User Request**: Build "Rollover" — a mobile-first, single-page React + TypeScript personal savings planner and daily expense tracker. LocalStorage persistence behind a storage interface. Deterministic financial engine (never AI). Server-side proxy endpoint for Claude API advisory calls. Full detail as logged verbatim in `aidlc-docs/audit.md` (Workspace Detection entry).
- **Request Type**: New Project (Greenfield)
- **Scope Estimate**: System-wide (new standalone app: frontend + minimal backend)
- **Complexity Estimate**: Moderate — the deterministic engine and rollover math need care; the rest is standard CRUD + a single external API integration.
- **Depth**: Standard (explicitly time-boxed to ~3.5h implementation; not comprehensive)

## Functional Requirements

### FR-1: Setup
- User enters, on first run: monthly net income, monthly savings goal, fixed monthly expenses as named items (name + amount, add/remove/edit any time), and a **cycle start day** (day-of-month 1–28 the tracking month begins on; default 1).
- User selects a **currency** (symbol/code, free text or picklist + "Other") during setup; used for display formatting only — all stored/calculated amounts remain plain numbers, currency-agnostic in the engine.
- User enters **category allocation weights** for the 4 discretionary categories (food, transport, entertainment, other) — percentages that must sum to 100%; validated at input time with a clear error if they don't. (Decided at Application Design, Q4 — supersedes the "finalized in Application Design" placeholder in the original FR-2 draft.)
- Setup values (including category weights) are editable at any time after initial entry (not one-time-only).

### FR-2: Deterministic Plan Engine
- Pure, typed, unit-tested functions — no AI involvement in any calculation.
- `discretionaryBudget = income - sum(fixedExpenses) - savingsGoal`
- If `discretionaryBudget < 0`: goal is **infeasible**. Engine reports:
  - the shortfall amount (`abs(discretionaryBudget)`)
  - the largest feasible goal (`income - sum(fixedExpenses)`, floored at 0)
- Feasible discretionary budget is allocated across 4 fixed categories — food, transport, entertainment, other — as a **monthly allowance per category**, using the user-configured weights from Setup (FR-1): `categoryMonthlyAllowance = discretionaryBudget * (categoryWeight / 100)`.
- **Rollover daily allowance** (per category, per FR clarification Q1): `dailyAllowance(category, day) = remainingCategoryBudget(day) / remainingDaysInCycle(day)`, recalculated each day. Remaining budget = category monthly allowance − category spend so far this cycle. Underspending increases tomorrow's allowance; overspending decreases it (floored at 0 — allowance never goes negative, spend can still exceed it and shows as over-allowance).
- **Cycle boundary** (per Q2): a monthly cycle runs from the user-configured cycle start day to the day before the same day next month (e.g. start day 15 → cycle is the 15th–14th). All "month-to-date" and "days remaining" math uses this cycle, not the calendar month, unless start day = 1 (calendar-month equivalent).

### FR-3: Daily Expense Tracking
- Log an expense: amount, category (one of the 4 fixed categories), date (defaults to today, editable/backdatable), optional note.
- **Two-tap add**: from the main screen, tapping the primary add action opens entry; a second tap submits. Category/date default sensibly (today, last-used or first category) to keep it to two taps for the common case.
- Main screen shows: today's spend vs. today's rollover-adjusted daily allowance (per category and/or total — finalized in Application Design), and month-to-date spend per category vs. that category's monthly allowance.

### FR-4: Savings Goal Progress
- Effective savings so far this cycle = discretionary budget − actual discretionary spend so far.
- Percentage of goal reached = `effectiveSavings / savingsGoal * 100` (handle `savingsGoal = 0` as a defined edge case, not divide-by-zero).
- Month-end projection: linear projection from current spend rate (`spendSoFar / daysElapsed * daysInCycle`) compared against the discretionary budget, to flag projected miss and by how much.

### FR-5: AI Advisory Layer
- Server-side proxy endpoint only; browser never holds the Gemini API key.
- Payload sent to Gemini: income, fixed expenses, allowances (monthly + current daily), current spend (today + month-to-date per category), projection, feasibility result. No raw calculation is delegated to Gemini — numbers in, coaching prose out.
- Structured output (typed JSON via Gemini's `responseSchema`/structured-output mechanism) covering: how to reach the goal, which categories to trim and by roughly how much, a realistic first step, and encouragement/warning based on pace.
- **Trigger** (per Q3): manual "Get Advice" button, available any time, **plus** an automatic weekly overview refresh.
  - **Assumption (flagged for review)**: "weekly overview" is implemented client-side — on app open, if 7+ days have elapsed since the last successful advice fetch, the app automatically triggers one refresh and labels that result as the "Weekly Overview" (vs. manually-triggered results). No server-side scheduler/cron is introduced (out of scope for a static SPA + minimal proxy). If this doesn't match intent, flag at requirements review.
- **Graceful degradation**: if the AI call fails, times out, or the endpoint is unreachable, the advice panel shows a clear error state (with retry). Plan/tracking features are fully unaffected — they never depend on the AI response.

## Non-Functional Requirements

### NFR-1: Mobile-First UI
- Design baseline: 360–430px width, scaled up to desktop (not the reverse).
- Single-column layout; primary actions (add expense) thumb-reachable near the bottom of the viewport.
- All tap targets ≥ 44×44px.
- Amount inputs use numeric input mode (`inputmode="decimal"` or equivalent).
- No functionality depends on `:hover`.

### NFR-2: Persistence & Extensibility
- All persistence goes through a storage interface/abstraction (e.g. `StoragePort`) — components and business logic never call `localStorage` directly. The concrete implementation is a localStorage adapter for this build.
- **Rationale**: keeps the door open for the backlogged cloud-sync item (swap adapter, no caller changes).
- Expense category model stays open/extensible (not hardcoded assumptions that block matching against future external offer data) even though only the 4 fixed categories are used in this build.

### NFR-3: AI Integration
- Official `@google/genai` (TypeScript) Gemini SDK, called only from the server-side proxy.
- **Model — configurable, not hardcoded**: server reads model name from an environment variable (`GEMINI_MODEL`), defaulting to `gemini-2.5-flash` if unset. Changing model is an env-var edit + server restart — no code change. (Default flagged as an assumption; override anytime via `.env`.)
- Structured outputs (typed schema) — frontend never parses free-form text.
- API key (`GEMINI_API_KEY`) and model (`GEMINI_MODEL`) supplied by user at Code Generation/build time via server-side `.env` (git-ignored), never pasted into chat or committed.

### NFR-4: Testing
- Deterministic engine functions are unit-tested (example-based).
- **Property-Based Testing — Partial enforcement** (opted in): PBT-02 (round-trip), PBT-03 (invariants), PBT-07 (generator quality), PBT-08 (shrinking/reproducibility), PBT-09 (framework selection) are enforced as blocking for the engine's pure functions. Framework: `fast-check` (TypeScript, Vitest-compatible). Scope kept lean given the time-box — a small set of high-value property tests (e.g. "category allowances always sum to the discretionary budget", "daily allowance never negative", storage read/write round-trip) rather than exhaustive per-function coverage.

### NFR-5: Security & Resiliency Extensions
- Both **opted out** for this build (explicit user decision — time-boxed learning project). **Backlogged** for a future hardening pass: enforce Security Baseline and Resiliency Baseline extensions before any production/public deployment. Recorded in `aidlc-state.md` Extension Configuration and carried into the Out of Scope section below.
- Baseline hygiene still applies regardless of opt-out: the API key is never sent to or held by the browser (this is a hard functional requirement, FR-5, not contingent on the extension).

## Out of Scope / Backlog (not built now)

1. **Cloud integration** — hosted backend, per-user accounts, cross-device sync, migration off localStorage. (User-specified backlog item.)
2. **Sri Lankan card offers** — scrape/ingest bank & aggregator offer pages, match against user spending by category. Depends on item 1. (User-specified backlog item.)
3. **Security Baseline extension** — full enforcement deferred; apply before production/public use.
4. **Resiliency Baseline extension** — full enforcement deferred; apply before production/public use.

Design constraint carried forward: storage interface abstraction (NFR-2) and open category model (NFR-2) ensure items 1–2 aren't architecturally blocked later.

## Summary

Personal, single-user, mobile-first budgeting SPA. All money math is deterministic and unit/property-tested; Gemini only adds plain-language coaching on top of numbers it never computes, via a key-hiding server proxy, manually triggered plus a weekly auto-refresh, degrading gracefully on failure. Cycle boundary and daily allowance both key off a user-configurable cycle-start day with true day-to-day rollover — matching the app's name. Standard depth, ~3.5h target; security/resiliency hardening explicitly deferred to backlog.
