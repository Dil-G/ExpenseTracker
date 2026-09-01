import {
  CATEGORY_IDS,
  type AllowanceBreakdown,
  type CategoryId,
  type CategoryWeights,
  type CycleWindow,
  type ExpenseEntry,
  type FeasibilityResult,
  type FixedExpenseItem,
  type ProgressResult,
} from './types';
import { addDays, clampDayToMonth, daysBetween, startOfDay, toISODate } from './dateUtils';

function sumAmounts(items: Array<{ amount: number }>): number {
  return items.reduce((total, item) => total + item.amount, 0);
}

function emptyCategoryRecord(): Record<CategoryId, number> {
  return { food: 0, transport: 0, entertainment: 0, other: 0 };
}

/** income - fixedExpenses - savingsGoal, floored at 0 (never negative). */
export function computeDiscretionaryBudget(
  income: number,
  fixedExpenses: FixedExpenseItem[],
  savingsGoal: number,
): number {
  const fixedTotal = sumAmounts(fixedExpenses);
  return Math.max(income - fixedTotal - savingsGoal, 0);
}

/** Feasibility is independent of the branch: largestFeasibleGoal and shortfall are
 * always computed via max()/floor, not derived conditionally. See business-logic-model.md. */
export function computeFeasibility(
  income: number,
  fixedExpenses: FixedExpenseItem[],
  savingsGoal: number,
): FeasibilityResult {
  const fixedTotal = sumAmounts(fixedExpenses);
  const largestFeasibleGoal = Math.max(income - fixedTotal, 0);
  const shortfall = Math.max(fixedTotal + savingsGoal - income, 0);
  const feasible = shortfall === 0;
  const discretionaryBudget = Math.max(income - fixedTotal - savingsGoal, 0);
  return { feasible, discretionaryBudget, shortfall, largestFeasibleGoal };
}

export function computeCategoryMonthlyAllowances(
  discretionaryBudget: number,
  weights: CategoryWeights,
): Record<CategoryId, number> {
  const result = emptyCategoryRecord();
  for (const category of CATEGORY_IDS) {
    result[category] = discretionaryBudget * (weights[category] / 100);
  }
  return result;
}

/** Cycle window for a given cycleStartDay (1-28) and "today". Start day is clamped to
 * the last valid day of whatever month it falls in (defensive; Setup validation already
 * caps cycleStartDay at 28 so this rarely engages in practice). remainingDays is floored
 * at 1 so the last day of a cycle never divides by zero. */
export function getCycleWindow(cycleStartDay: number, today: Date): CycleWindow {
  const todayMidnight = startOfDay(today);
  const y = todayMidnight.getFullYear();
  const m = todayMidnight.getMonth();

  const candidateStartThisMonth = new Date(y, m, clampDayToMonth(y, m, cycleStartDay));

  let start: Date;
  let end: Date;

  if (todayMidnight.getTime() >= candidateStartThisMonth.getTime()) {
    start = candidateStartThisMonth;
    const nextY = m === 11 ? y + 1 : y;
    const nextM = (m + 1) % 12;
    const nextCycleStart = new Date(nextY, nextM, clampDayToMonth(nextY, nextM, cycleStartDay));
    end = addDays(nextCycleStart, -1);
  } else {
    const prevY = m === 0 ? y - 1 : y;
    const prevM = (m + 11) % 12;
    start = new Date(prevY, prevM, clampDayToMonth(prevY, prevM, cycleStartDay));
    end = addDays(candidateStartThisMonth, -1);
  }

  const totalDays = daysBetween(start, end) + 1;
  const dayIndex = daysBetween(start, todayMidnight) + 1;
  const remainingDays = Math.max(totalDays - dayIndex + 1, 1);

  return { start, end, dayIndex, totalDays, remainingDays };
}

export function computeSpendAggregates(
  entries: ExpenseEntry[],
  cycleWindow: CycleWindow,
  today: Date,
): { spentThisCycle: Record<CategoryId, number>; spentToday: Record<CategoryId, number> } {
  const startMs = cycleWindow.start.getTime();
  const endMs = cycleWindow.end.getTime();
  const todayIso = toISODate(today);

  const spentThisCycle = emptyCategoryRecord();
  const spentToday = emptyCategoryRecord();

  for (const entry of entries) {
    const entryDate = startOfDay(new Date(`${entry.date}T00:00:00`));
    const entryMs = entryDate.getTime();
    if (entryMs < startMs || entryMs > endMs) continue;
    spentThisCycle[entry.category] += entry.amount;
    if (entry.date === todayIso) {
      spentToday[entry.category] += entry.amount;
    }
  }

  return { spentThisCycle, spentToday };
}

/** Live/shrinking allowance (Q1: B) — remainingBudget already reflects everything spent
 * this cycle including today, so dailyAllowance shrinks immediately as expenses are logged. */
export function computeAllowanceBreakdown(
  discretionaryBudget: number,
  weights: CategoryWeights,
  entries: ExpenseEntry[],
  cycleWindow: CycleWindow,
  today: Date,
): AllowanceBreakdown {
  const monthlyAllowances = computeCategoryMonthlyAllowances(discretionaryBudget, weights);
  const { spentThisCycle } = computeSpendAggregates(entries, cycleWindow, today);

  const breakdown = {} as AllowanceBreakdown;
  for (const category of CATEGORY_IDS) {
    const monthlyAllowance = monthlyAllowances[category];
    const spent = spentThisCycle[category];
    const remainingBudget = Math.max(monthlyAllowance - spent, 0);
    breakdown[category] = {
      monthlyAllowance,
      spentThisCycle: spent,
      remainingBudget,
      dailyAllowance: remainingBudget / cycleWindow.remainingDays,
    };
  }
  return breakdown;
}

export function computeProgress(
  discretionaryBudget: number,
  savingsGoal: number,
  entries: ExpenseEntry[],
  cycleWindow: CycleWindow,
  today: Date,
): ProgressResult {
  const { spentThisCycle } = computeSpendAggregates(entries, cycleWindow, today);
  const totalDiscretionarySpend = sumAmounts(
    CATEGORY_IDS.map((category) => ({ amount: spentThisCycle[category] })),
  );
  const effectiveSavings = discretionaryBudget - totalDiscretionarySpend;

  if (savingsGoal === 0) {
    return {
      hasGoal: false,
      effectiveSavings,
      percentOfGoal: null,
      projectedEndOfCycleSavings: discretionaryBudget - totalDiscretionarySpend,
      onTrack: null,
      projectedShortfall: 0,
    };
  }

  const percentOfGoal = (effectiveSavings / savingsGoal) * 100;
  const dailySpendRate = totalDiscretionarySpend / cycleWindow.dayIndex;
  const projectedTotalSpend = dailySpendRate * cycleWindow.totalDays;
  const projectedEndOfCycleSavings = discretionaryBudget - projectedTotalSpend;
  const onTrack = projectedEndOfCycleSavings >= savingsGoal;
  const projectedShortfall = onTrack ? 0 : savingsGoal - projectedEndOfCycleSavings;

  return {
    hasGoal: true,
    effectiveSavings,
    percentOfGoal,
    projectedEndOfCycleSavings,
    onTrack,
    projectedShortfall,
  };
}
