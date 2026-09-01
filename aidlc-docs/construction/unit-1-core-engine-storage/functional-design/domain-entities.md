# Domain Entities — Unit 1: Core Engine & Storage

## Persisted Entities (via `StoragePort`)

### `PlanConfig`
```ts
{
  monthlyIncome: number;          // >= 0
  savingsGoal: number;            // >= 0
  cycleStartDay: number;          // 1-28
  currency: string;                // free-text symbol/code, display only
  categoryWeights: CategoryWeights;
}
```

### `CategoryWeights`
```ts
{
  food: number;          // percentage, 0-100
  transport: number;
  entertainment: number;
  other: number;
}
// Invariant: food + transport + entertainment + other === 100 (validated at write time)
```

### `FixedExpenseItem`
```ts
{
  id: string;
  name: string;      // non-empty
  amount: number;    // >= 0
}
```

### `ExpenseEntry`
```ts
{
  id: string;
  amount: number;         // > 0
  category: CategoryId;   // 'food' | 'transport' | 'entertainment' | 'other'
  date: string;            // ISO date (YYYY-MM-DD), user-editable, can be backdated
  note?: string;
}
```

### Advice Metadata (persisted alongside, owned by Unit 2 but stored via the same `StoragePort`)
```ts
{
  lastAdviceFetchAt: string | null; // ISO timestamp
}
```

## Derived / Transient Types (computed by `PlanEngine`, never persisted)

### `CycleWindow`
```ts
{
  start: Date;
  end: Date;              // inclusive, last day of cycle
  dayIndex: number;        // 1-based, which day of the cycle "today" is
  totalDays: number;
  remainingDays: number;   // includes today, floored at 1
}
```

### `FeasibilityResult`
```ts
{
  feasible: boolean;
  discretionaryBudget: number;   // floored at 0 when infeasible for allowance purposes
  shortfall: number;              // 0 if feasible
  largestFeasibleGoal: number;    // max(income - fixedExpensesTotal, 0)
}
```

### `AllowanceBreakdown`
```ts
Record<CategoryId, {
  monthlyAllowance: number;   // 0 if infeasible
  spentThisCycle: number;
  remainingBudget: number;    // monthlyAllowance - spentThisCycle, floored at 0
  dailyAllowance: number;     // remainingBudget / cycleWindow.remainingDays — live, recalculates as spend is logged (Q1: B)
}>
```

### `ProgressResult`
```ts
{
  hasGoal: boolean;                  // false when savingsGoal === 0 (Q2: B)
  effectiveSavings: number;           // discretionaryBudget - totalDiscretionarySpendThisCycle
  percentOfGoal: number | null;       // null when !hasGoal
  projectedEndOfCycleSavings: number;
  onTrack: boolean | null;            // null when !hasGoal
  projectedShortfall: number;         // 0 if on track or !hasGoal
}
```

## Relationships
- `PlanConfig` (1) has `CategoryWeights` (1, embedded)
- `PlanConfig` (1) —feasibility calc against→ `FixedExpenseItem[]` (many)
- `ExpenseEntry[]` (many) bucket into whichever `CycleWindow` contains their `date`
- `AllowanceBreakdown` and `ProgressResult` are always derived fresh from `PlanConfig` + `FixedExpenseItem[]` + `ExpenseEntry[]` at read time — never stored, never stale (Q5: A, mid-cycle edits apply immediately since there's no cached derived state to invalidate).
