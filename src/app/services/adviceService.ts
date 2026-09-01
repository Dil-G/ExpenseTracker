import type { AdviceRequestPayload, AllowanceBreakdown, FeasibilityResult, PlanConfig, ProgressResult } from '../../core/types';

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
  feasibility: FeasibilityResult,
  categoryAllowances: AllowanceBreakdown,
  progress: ProgressResult,
): AdviceRequestPayload {
  return {
    income: config.monthlyIncome,
    fixedExpensesTotal,
    savingsGoal: config.savingsGoal,
    feasibility,
    categoryAllowances,
    progress,
    currency: config.currency,
  };
}
