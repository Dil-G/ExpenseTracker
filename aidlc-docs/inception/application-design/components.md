# Components — Rollover

## Core Layer (Unit 1 — Core Engine & Storage)

### `Models` (`src/core/types.ts`)
**Purpose**: Shared TypeScript types for the whole app.
**Responsibilities**: Define `PlanConfig`, `FixedExpenseItem`, `CategoryId` (`'food' | 'transport' | 'entertainment' | 'other'`), `CategoryWeights`, `ExpenseEntry`, `FeasibilityResult`, `AllowanceBreakdown`, `ProgressResult`, `AdviceRequestPayload`, `AdviceResponse`. No behavior, types only.

### `PlanEngine` (`src/core/planEngine.ts`)
**Purpose**: The deterministic financial engine. Pure functions only — no I/O, no AI, no side effects.
**Responsibilities**: discretionary budget calculation, feasibility check (incl. largest-feasible-goal + shortfall), category monthly allowance split by weights, rollover daily allowance per category, cycle boundary math (cycle-start-day aware), today/MTD spend aggregation helpers, savings progress (effective savings, % of goal, month-end projection, on-track/miss flag).

### `StoragePort` (`src/core/storage/storagePort.ts`)
**Purpose**: Persistence abstraction. The one seam the entire app depends on instead of `localStorage` directly.
**Responsibilities**: typed get/set/remove for each stored entity (`PlanConfig`, `FixedExpenseItem[]`, `ExpenseEntry[]`, advice metadata like `lastAdviceFetchAt`). No component outside `LocalStorageAdapter` knows the storage mechanism.

### `LocalStorageAdapter` (`src/core/storage/localStorageAdapter.ts`)
**Purpose**: Concrete `StoragePort` implementation for this build.
**Responsibilities**: JSON serialize/deserialize to/from `window.localStorage`, namespaced/versioned keys, safe parse (corrupt/missing data returns sensible defaults, never throws to callers).

## App Layer (Unit 2 — Web App, client)

### `AppProvider` (`src/app/state/AppProvider.tsx`)
**Purpose**: Top-level React Context. The only place `StoragePort` is instantiated and injected.
**Responsibilities**: load persisted state on mount, hold current `PlanConfig` / `FixedExpenseItem[]` / `ExpenseEntry[]` / advice UI state, expose actions (via `PlanService`/`TrackingService`/`AdviceOrchestrationService`) to descendants through a hook (`useAppState()`).

### UI Components (`src/app/components/`)
- `SetupScreen` — first-run + editable-later form: income, goal, fixed expenses list, cycle start day, currency, category weights (with sum-to-100% validation).
- `MainScreen` — single-column mobile-first layout: today's spend vs. rollover daily allowance, MTD per category vs. monthly allowance, fixed bottom-anchored Add button.
- `AddExpenseSheet` — bottom sheet/modal: amount (numeric keypad), category picker, date (defaults today), note. Two taps total from `MainScreen`.
- `ProgressPanel` — effective savings, % of goal, month-end projection, miss-warning.
- `AdvicePanel` — renders structured advice, loading state, error state with retry, distinguishes manual vs. weekly-overview results.

## Server Layer (Unit 2 — Advice Proxy, server)

### `AdviceProxyServer` (`server/app.ts`)
**Purpose**: Minimal Express app.
**Responsibilities**: `POST /api/advice` route, request body validation, error responses; holds no business/financial logic.

### `GeminiAdviceService` (`server/geminiAdviceService.ts`)
**Purpose**: Talks to Gemini. The only component that imports `@google/genai`.
**Responsibilities**: build the prompt from the incoming plan snapshot, call Gemini with `responseSchema` for structured output, map the result to `AdviceResponse`, translate SDK/network errors into a typed error the route can turn into an HTTP error response. Reads `GEMINI_API_KEY` / `GEMINI_MODEL` from server env.
