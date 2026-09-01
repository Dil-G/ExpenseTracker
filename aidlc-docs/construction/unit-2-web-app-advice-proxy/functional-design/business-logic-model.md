# Business Logic Model — Unit 2: Web App & Advice Proxy

## App Shell / Navigation Flow

```
On load:
  config = StoragePort.getPlanConfig()
  if config === null:
    render SetupWizard (step 1)
  else:
    render TabbedShell (default tab: 'today')
      header includes a settings icon -> reopens SetupWizard (pre-filled from current config + fixed expenses)
```

## Setup Wizard Flow (3 steps, per plan Q3a)

```
Step 1 (Income & Goal): monthlyIncome, savingsGoal, cycleStartDay, currency
  -> validate (business-rules.md) -> "Next"
Step 2 (Fixed Expenses): add/remove named items, each validated on add
  -> "Next" (Step 2 has no required minimum — zero fixed expenses is valid)
Step 3 (Category Weights): 4 numeric inputs, running sum shown live
  -> validate sum === 100 -> "Finish Setup"
  -> on finish: PlanService.saveSetup(config, fixedExpenses) -> StoragePort writes
  -> navigate to TabbedShell, tab='today'
```
Re-entering via the settings icon starts at Step 1 pre-filled with current values; "Finish Setup" on Step 3 overwrites the existing config (Unit 1 Q5: mid-cycle edits apply immediately).

## Tab Bar (per plan Q1a)

```
Today tab:    TodaySummary (spend vs rollover daily allowance) + CategoryBreakdown (MTD vs monthly allowance)
              + InfeasibilityBanner (shown above everything else when !feasibility.feasible)
              + fixed bottom AddExpenseButton -> opens AddExpenseSheet
Progress tab: ProgressPanel (effective savings, % of goal, projection, on-track/miss flag)
Advice tab:   AdvicePanel (idle/loading/success/error states, per plan Q5)
```
All three tabs read from the same `AppProvider` context (`PlanService`/`TrackingService`/`AdviceOrchestrationService` outputs) — switching tabs never refetches or recomputes, it only changes which section is visible.

## Add Expense Flow (two-tap, per plan Q2)

```
Tap 1: bottom "+" button -> AddExpenseSheet opens
  amount field auto-focused, numeric keypad (inputmode="decimal")
  category pre-selected: last-used category (persisted in component state, not StoragePort)
  date pre-filled: today (ISO)
Tap 2: "Save" button
  -> TrackingService.addExpense({ amount, category, date, note }) -> StoragePort.addExpenseEntry
  -> sheet closes, Today tab re-renders with updated live allowance
```
Changing category, date, or adding a note are optional extra interactions, not required for the two-tap path.

## Advice Request Flow

```
Manual: user taps "Get Advice" on Advice tab -> AdviceOrchestrationService.requestAdvice(kind: 'manual')
Weekly (automatic): on TabbedShell mount, if StoragePort.getLastAdviceFetchAt() is null
  or >= 7 days old -> requestAdvice(kind: 'weekly') fires automatically, once, silently
  (no loading spinner shown unless the user is already on the Advice tab)

requestAdvice(kind):
  status = 'loading'
  payload = build AdviceRequestPayload from current PlanService/TrackingService output
  try:
    response = AdviceClient.fetchAdvice(payload)  -- POST /api/advice
    status = 'success'; data = response; lastFetchKind = kind
    StoragePort.setLastAdviceFetchAt(now)
  catch (error):
    status = 'error'; errorMessage = human-readable message from error
    -- StoragePort.lastAdviceFetchAt is NOT updated on failure, so a failed weekly
    -- attempt will retry on next app load rather than waiting another 7 days
```

## Server: `/api/advice` Route

```
POST /api/advice
  validate body against AdviceRequestPayload shape (business-rules.md)
  if invalid -> 400 { error }
  try:
    response = GeminiAdviceService.getAdvice(body)
    -> 200 response
  catch (error):
    log error server-side (console.error, includes request id / timestamp)
    -> 502 { error: "Advice temporarily unavailable" }  -- never leak raw SDK error details to the client
```
