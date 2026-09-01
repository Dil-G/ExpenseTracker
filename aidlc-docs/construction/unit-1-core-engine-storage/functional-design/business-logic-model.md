# Business Logic Model — Unit 1: Core Engine & Storage

All calculations are pure functions of `(PlanConfig, FixedExpenseItem[], ExpenseEntry[], now: Date)` — no hidden state, no I/O inside `PlanEngine` itself (I/O lives in `StoragePort`/`LocalStorageAdapter`, called by `PlanService`/`TrackingService`, not by the engine).

## 1. Feasibility & Discretionary Budget

```
fixedExpensesTotal = sum(fixedExpenses.map(f => f.amount))
rawDiscretionary = monthlyIncome - fixedExpensesTotal - savingsGoal

largestFeasibleGoal = max(monthlyIncome - fixedExpensesTotal, 0)   # always computed, regardless of branch
shortfall = max((fixedExpensesTotal + savingsGoal) - monthlyIncome, 0)
feasible = shortfall == 0
discretionaryBudget = max(rawDiscretionary, 0)                      # Q4: A — floored, not negative
```

## 2. Cycle Window

```
cycleStartDay: 1-28 (validated at Setup)

getCycleWindow(cycleStartDay, today):
    candidateStartThisMonth = clamp(cycleStartDay, to last valid day of today's month)   # Q3: A
    if today >= candidateStartThisMonth:
        start = candidateStartThisMonth
        end = clamp(cycleStartDay, last valid day of next month) - 1 day
    else:
        start = clamp(cycleStartDay, last valid day of previous month)
        end = candidateStartThisMonth - 1 day

    totalDays = daysBetween(start, end) + 1
    dayIndex = daysBetween(start, today) + 1
    remainingDays = max(totalDays - dayIndex + 1, 1)   # floored at 1 so last day never divides by zero
    return { start, end, dayIndex, totalDays, remainingDays }
```

`cycleStartDay` is capped at 28 in `PlanConfig` validation specifically so "clamp to last valid day" only ever matters for edge months (Feb) with a start day chosen near month-end — kept simple rather than modeling every 29/30/31-day edge case a higher start day would introduce.

## 3. Category Allowances (monthly + live daily)

```
categoryMonthlyAllowance(category) = discretionaryBudget * (categoryWeights[category] / 100)

spendAggregates(entries, cycleWindow):
    thisCycleEntries = entries.filter(e => cycleWindow.start <= e.date <= cycleWindow.end)
    todayEntries = thisCycleEntries.filter(e => e.date == today)
    return {
        spentThisCycle: groupSumByCategory(thisCycleEntries),
        spentToday: groupSumByCategory(todayEntries)
    }

for each category:
    remainingBudget = max(categoryMonthlyAllowance(category) - spentThisCycle[category], 0)
    dailyAllowance = remainingBudget / cycleWindow.remainingDays
    # Q1: B — live/shrinking: as spentThisCycle grows today, remainingBudget shrinks and
    # dailyAllowance is recomputed immediately on next read (after every add/delete of an
    # expense dated today or any prior day in the current cycle). There is no separate
    # "locked this morning" value — this IS "today's allowance", continuously current.
```

## 4. Savings Progress

```
totalDiscretionarySpendThisCycle = sum(spentThisCycle across all 4 categories)
effectiveSavings = discretionaryBudget - totalDiscretionarySpendThisCycle

if savingsGoal == 0:
    hasGoal = false                                    # Q2: B
    percentOfGoal = null
    onTrack = null
    projectedShortfall = 0
else:
    hasGoal = true
    percentOfGoal = (effectiveSavings / savingsGoal) * 100
    dailySpendRate = totalDiscretionarySpendThisCycle / cycleWindow.dayIndex
    projectedTotalSpend = dailySpendRate * cycleWindow.totalDays
    projectedEndOfCycleSavings = discretionaryBudget - projectedTotalSpend
    onTrack = projectedEndOfCycleSavings >= savingsGoal
    projectedShortfall = onTrack ? 0 : (savingsGoal - projectedEndOfCycleSavings)
```

`dayIndex` starts at 1 (first day of cycle), so `dailySpendRate` never divides by zero.

## 5. Storage Read/Write Flow (round-trip, relevant to PBT-02)

```
write: entity (typed object) -> JSON.stringify -> localStorage.setItem(key, json)
read:  localStorage.getItem(key) -> JSON.parse -> validate shape -> typed object | null (if missing/corrupt)
```
Round-trip property: `read(write(x)) === x` for all valid `PlanConfig` / `FixedExpenseItem[]` / `ExpenseEntry[]` — this is the PBT-02 target for `LocalStorageAdapter`.
