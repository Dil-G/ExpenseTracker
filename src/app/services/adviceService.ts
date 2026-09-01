import type { AdviceRequestPayload, CategorySpendMap, FeasibilityResult, Goal, PlanConfig, ProgressResult } from '../../core/types';

const WEEKLY_MS = 7 * 24 * 60 * 60 * 1000;

/** Whether an automatic "weekly overview" advice fetch should fire on app load —
 * never fetched before, or the last successful fetch is 7+ days old. */
export function shouldAutoFetchWeekly(lastFetchAt: string | null, now: Date): boolean {
  if (!lastFetchAt) return true;
  const last = new Date(lastFetchAt).getTime();
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= WEEKLY_MS;
}

export function buildAdviceRequestPayload(
  config: PlanConfig,
  fixedExpensesTotal: number,
  goal: Goal | null,
  requiredMonthlyPace: number,
  feasibility: FeasibilityResult,
  categorySpend: CategorySpendMap,
  progress: ProgressResult,
): AdviceRequestPayload {
  return {
    income: config.monthlyIncome,
    fixedExpensesTotal,
    targetAmount: goal?.targetAmount ?? 0,
    targetDate: goal?.targetDate ?? '',
    requiredMonthlyPace,
    feasibility,
    categorySpend,
    progress,
    currency: config.currency,
  };
}
