import {
  type CategorySpendMap,
  type CycleWindow,
  type ExpenseEntry,
  type FeasibilityResult,
  type FixedExpenseItem,
  type Goal,
  type ProgressResult,
  type SavingsLedgerState,
} from './types';
import { addDays, clampDayToMonth, daysBetween, parseISODate, startOfDay, toISODate } from './dateUtils';

function sumAmounts(items: Array<{ amount: number }>): number {
  return items.reduce((total, item) => total + item.amount, 0);
}

/** income - fixedExpenses - requiredMonthlyPace, floored at 0 (never negative). */
export function computeDiscretionaryBudget(
  income: number,
  fixedExpenses: FixedExpenseItem[],
  requiredMonthlyPace: number,
): number {
  const fixedTotal = sumAmounts(fixedExpenses);
  return Math.max(income - fixedTotal - requiredMonthlyPace, 0);
}

/** Feasibility is independent of the branch: largestFeasibleGoal and shortfall are
 * always computed via max()/floor, not derived conditionally. See business-logic-model.md.
 * "Goal" here is the derived requiredMonthlyPace (CR2), not a manually-entered value. */
export function computeFeasibility(
  income: number,
  fixedExpenses: FixedExpenseItem[],
  requiredMonthlyPace: number,
): FeasibilityResult {
  const fixedTotal = sumAmounts(fixedExpenses);
  const largestFeasibleGoal = Math.max(income - fixedTotal, 0);
  const shortfall = Math.max(fixedTotal + requiredMonthlyPace - income, 0);
  const feasible = shortfall === 0;
  const discretionaryBudget = Math.max(income - fixedTotal - requiredMonthlyPace, 0);
  return { feasible, discretionaryBudget, shortfall, largestFeasibleGoal };
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

/** Categories are open/dynamic (CR2) - spend maps are built from whatever category ids
 * appear in the entries, not a fixed set. */
export function computeSpendAggregates(
  entries: ExpenseEntry[],
  cycleWindow: CycleWindow,
  today: Date,
): { spentThisCycle: CategorySpendMap; spentToday: CategorySpendMap; totalThisCycle: number; totalToday: number } {
  const startMs = cycleWindow.start.getTime();
  const endMs = cycleWindow.end.getTime();
  const todayIso = toISODate(today);

  const spentThisCycle: CategorySpendMap = {};
  const spentToday: CategorySpendMap = {};
  let totalThisCycle = 0;
  let totalToday = 0;

  for (const entry of entries) {
    const entryDate = startOfDay(new Date(`${entry.date}T00:00:00`));
    const entryMs = entryDate.getTime();
    if (entryMs < startMs || entryMs > endMs) continue;
    spentThisCycle[entry.category] = (spentThisCycle[entry.category] ?? 0) + entry.amount;
    totalThisCycle += entry.amount;
    if (entry.date === todayIso) {
      spentToday[entry.category] = (spentToday[entry.category] ?? 0) + entry.amount;
      totalToday += entry.amount;
    }
  }

  return { spentThisCycle, spentToday, totalThisCycle, totalToday };
}

/** How much needs to be saved per month, on average, from now until targetDate, to reach
 * targetAmount given what's already banked (CR2 — replaces the old flat monthly
 * savingsGoal). A targetDate in the past (overdue goal) still produces a sane, large
 * number rather than dividing by zero — daysRemaining floors at 1, never at a whole month. */
export function computeRequiredMonthlyPace(targetAmount: number, bankedTotal: number, targetDate: string, asOf: Date): number {
  const remaining = Math.max(targetAmount - bankedTotal, 0);
  const daysRemaining = Math.max(daysBetween(asOf, parseISODate(targetDate)), 1);
  const monthsRemaining = daysRemaining / 30;
  return remaining / monthsRemaining;
}

/** Banks completed cycles' effective savings into the running ledger total (CR2). Walks
 * forward cycle-by-cycle from the last-banked cycle (or the goal's start cycle, if
 * nothing has been banked yet) up to — but not including — the current cycle, so a
 * gap of several missed app-opens still banks every cycle in between rather than just
 * the most recent one. Recomputes each historical cycle's pace/budget using *current*
 * income and fixed expenses (there's no historical snapshot of those) — an accepted
 * approximation, not a full historical replay. Bounded to 60 iterations (5 years) as a
 * safety cap, not an expected case. */
export function updateSavingsLedger(
  ledger: SavingsLedgerState,
  goal: Goal,
  cycleStartDay: number,
  income: number,
  fixedExpensesTotal: number,
  entries: ExpenseEntry[],
  today: Date,
): SavingsLedgerState {
  const currentCycle = getCycleWindow(cycleStartDay, today);
  let bankedTotal = ledger.bankedTotal;
  let lastBanked = ledger.lastBankedCycleStart;

  // Resume from the cycle AFTER the last one banked, not the last-banked cycle itself
  // (which would re-bank it every time this runs within the same current cycle).
  const cursorStart = lastBanked
    ? addDays(getCycleWindow(cycleStartDay, parseISODate(lastBanked)).end, 1)
    : parseISODate(goal.startDate);
  let cursorWindow = getCycleWindow(cycleStartDay, cursorStart);

  let iterations = 0;
  while (toISODate(cursorWindow.start) !== toISODate(currentCycle.start) && iterations < 60) {
    const { totalThisCycle } = computeSpendAggregates(entries, cursorWindow, cursorWindow.end);
    const pace = computeRequiredMonthlyPace(goal.targetAmount, bankedTotal, goal.targetDate, cursorWindow.end);
    const budget = Math.max(income - fixedExpensesTotal - pace, 0);
    bankedTotal += budget - totalThisCycle;
    lastBanked = toISODate(cursorWindow.start);

    const nextDay = addDays(cursorWindow.end, 1);
    cursorWindow = getCycleWindow(cycleStartDay, nextDay);
    iterations++;
  }

  return { bankedTotal, lastBankedCycleStart: lastBanked };
}

export function computeProgress(
  discretionaryBudget: number,
  bankedTotal: number,
  targetAmount: number,
  requiredMonthlyPace: number,
  entries: ExpenseEntry[],
  cycleWindow: CycleWindow,
  today: Date,
): ProgressResult {
  const { totalThisCycle } = computeSpendAggregates(entries, cycleWindow, today);
  const currentCycleEffectiveSavings = discretionaryBudget - totalThisCycle;
  const totalSavedSoFar = bankedTotal + currentCycleEffectiveSavings;
  const dailySpendRate = totalThisCycle / cycleWindow.dayIndex;

  if (targetAmount === 0) {
    return {
      hasGoal: false,
      totalSavedSoFar,
      percentOfGoal: null,
      requiredMonthlyPace,
      projectedEndOfCycleSavings: currentCycleEffectiveSavings,
      onTrack: null,
      projectedShortfall: 0,
      dailySpendRate,
    };
  }

  const percentOfGoal = (totalSavedSoFar / targetAmount) * 100;
  const projectedTotalSpend = dailySpendRate * cycleWindow.totalDays;
  const projectedEndOfCycleSavings = discretionaryBudget - projectedTotalSpend;
  const onTrack = projectedEndOfCycleSavings >= requiredMonthlyPace;
  const projectedShortfall = onTrack ? 0 : requiredMonthlyPace - projectedEndOfCycleSavings;

  return {
    hasGoal: true,
    totalSavedSoFar,
    percentOfGoal,
    requiredMonthlyPace,
    projectedEndOfCycleSavings,
    onTrack,
    projectedShortfall,
    dailySpendRate,
  };
}
