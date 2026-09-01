# Services — Rollover

Services orchestrate one or more components; they hold no business logic of their own beyond wiring.

## `PlanService` (client)
- **Orchestrates**: `StoragePort` + `PlanEngine`
- **Responsibility**: read plan config/fixed expenses from storage, run `PlanEngine` calculations, expose a ready-to-render plan view model to the UI. Write path (`saveSetup`) validates (category weights sum to 100%, income ≥ 0, etc.) then persists via `StoragePort`.
- **Consumers**: `SetupScreen`, `MainScreen`, `ProgressPanel`.

## `TrackingService` (client)
- **Orchestrates**: `StoragePort` + `PlanEngine`
- **Responsibility**: expense CRUD via `StoragePort`; derives today/MTD spend and rollover-adjusted daily allowances via `PlanEngine`, using the current cycle window from `PlanService`.
- **Consumers**: `MainScreen`, `AddExpenseSheet`.

## `AdviceOrchestrationService` (client)
- **Orchestrates**: `AdviceClient` + `StoragePort` (advice metadata) + current plan/tracking view models
- **Responsibility**: builds the `AdviceRequestPayload` from `PlanService`/`TrackingService` output, calls `AdviceClient`, tracks loading/error state, decides manual vs. weekly-overview trigger (7-day check against `getLastAdviceFetchAt()` on app load), updates `lastAdviceFetchAt` after a successful fetch.
- **Consumers**: `AdvicePanel`.
- **Failure handling**: any thrown error from `AdviceClient` is caught here and surfaced as `status: 'error'` — never propagates to crash the UI; plan/tracking state is untouched.

## `GeminiAdviceService` (server)
- **Orchestrates**: prompt construction + `@google/genai` SDK call + response mapping
- **Responsibility**: turn the numeric plan snapshot into a prompt, call Gemini with a `responseSchema` matching `AdviceResponse`, validate/parse the structured result, throw a typed error on any SDK/network/validation failure (caught by the Express route and turned into a 502).
- **Consumers**: `AdviceProxyServer` route handler only.

## Orchestration Flow (happy path, manual advice request)

```
AddExpenseSheet -> TrackingService.addExpense() -> StoragePort.addExpenseEntry()
                                                  -> PlanEngine (recompute spend aggregates)
MainScreen re-renders from TrackingService.useTracking()

User taps "Get Advice" -> AdviceOrchestrationService.requestAdvice()
  -> builds payload from PlanService + TrackingService current values
  -> AdviceClient.fetchAdvice(payload) --HTTP--> AdviceProxyServer
  -> GeminiAdviceService.getAdvice(payload) --SDK--> Gemini API
  <- AdviceResponse
  <- AdvicePanel renders advice; StoragePort.setLastAdviceFetchAt(now)
```
