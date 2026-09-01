# Component Methods — Rollover

Method signatures only — business rules (exact formulas, edge cases) are detailed in Functional Design (per-unit, CONSTRUCTION phase).

## `PlanEngine` (pure functions, `src/core/planEngine.ts`)

```ts
computeDiscretionaryBudget(income: number, fixedExpenses: FixedExpenseItem[], savingsGoal: number): number

computeFeasibility(income: number, fixedExpenses: FixedExpenseItem[], savingsGoal: number): FeasibilityResult
// { feasible: boolean; shortfall: number; largestFeasibleGoal: number }

computeCategoryMonthlyAllowances(discretionaryBudget: number, weights: CategoryWeights): Record<CategoryId, number>

getCycleWindow(cycleStartDay: number, today: Date): { start: Date; end: Date; dayIndex: number; totalDays: number; remainingDays: number }

computeDailyRolloverAllowance(categoryMonthlyAllowance: number, spentSoFarInCategory: number, cycleWindow: ReturnType<typeof getCycleWindow>): number

computeSpendAggregates(entries: ExpenseEntry[], cycleWindow: ReturnType<typeof getCycleWindow>): { today: Record<CategoryId, number>; monthToDate: Record<CategoryId, number> }

computeProgress(discretionaryBudget: number, monthToDateDiscretionarySpend: number, savingsGoal: number, cycleWindow: ReturnType<typeof getCycleWindow>): ProgressResult
// { effectiveSavings: number; percentOfGoal: number; projectedEndOfCycleSavings: number; onTrack: boolean; projectedShortfall: number }
```

## `StoragePort` (interface, `src/core/storage/storagePort.ts`)

```ts
getPlanConfig(): PlanConfig | null
setPlanConfig(config: PlanConfig): void

getFixedExpenses(): FixedExpenseItem[]
setFixedExpenses(items: FixedExpenseItem[]): void

getExpenseEntries(): ExpenseEntry[]
addExpenseEntry(entry: ExpenseEntry): void
updateExpenseEntry(id: string, patch: Partial<ExpenseEntry>): void
deleteExpenseEntry(id: string): void

getLastAdviceFetchAt(): string | null // ISO timestamp
setLastAdviceFetchAt(iso: string): void
```

## `LocalStorageAdapter` implements `StoragePort`
Same signature as above; no additional public methods.

## `PlanService` (`src/app/services/planService.ts`)

```ts
useCurrentPlan(): {
  config: PlanConfig | null;
  feasibility: FeasibilityResult | null;
  categoryAllowances: Record<CategoryId, number> | null;
  cycleWindow: ReturnType<typeof getCycleWindow> | null;
}
saveSetup(config: PlanConfig, fixedExpenses: FixedExpenseItem[]): void
```

## `TrackingService` (`src/app/services/trackingService.ts`)

```ts
useTracking(): {
  entries: ExpenseEntry[];
  todaySpend: Record<CategoryId, number>;
  monthToDateSpend: Record<CategoryId, number>;
  dailyAllowances: Record<CategoryId, number>; // rollover-adjusted
}
addExpense(input: { amount: number; category: CategoryId; date: string; note?: string }): void
deleteExpense(id: string): void
```

## `AdviceOrchestrationService` (`src/app/services/adviceService.ts`)

```ts
useAdvice(): {
  advice: AdviceResponse | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  lastFetchKind: 'manual' | 'weekly' | null;
  requestAdvice(): Promise<void>; // manual trigger
}
// on mount: checks getLastAdviceFetchAt(); if >= 7 days (or never), auto-invokes requestAdvice() tagged 'weekly'
```

## `AdviceClient` (`src/app/services/adviceClient.ts`)

```ts
fetchAdvice(payload: AdviceRequestPayload): Promise<AdviceResponse> // POST /api/advice, throws typed error on failure
```

## `AdviceProxyServer` (`server/app.ts`)

```ts
POST /api/advice
  body: AdviceRequestPayload
  200 -> AdviceResponse
  400 -> { error: string }  // invalid payload
  502 -> { error: string }  // Gemini call failed
```

## `GeminiAdviceService` (`server/geminiAdviceService.ts`)

```ts
getAdvice(payload: AdviceRequestPayload): Promise<AdviceResponse> // throws on failure; caller (route) maps to HTTP status
```
