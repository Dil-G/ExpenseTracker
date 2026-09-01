import { computeCategoryMonthlyAllowances, computeFeasibility, getCycleWindow } from '../../core/planEngine';
import type { CycleWindow, FeasibilityResult, FixedExpenseItem, PlanConfig } from '../../core/types';
import { CATEGORY_IDS, type CategoryId } from '../../core/types';
import type { StoragePort } from '../../core/storage/storagePort';

export interface PlanView {
  config: PlanConfig | null;
  feasibility: FeasibilityResult | null;
  monthlyAllowances: Record<CategoryId, number> | null;
  cycleWindow: CycleWindow | null;
}

export function buildPlanView(config: PlanConfig | null, fixedExpenses: FixedExpenseItem[], today: Date): PlanView {
  if (!config) {
    return { config: null, feasibility: null, monthlyAllowances: null, cycleWindow: null };
  }
  const feasibility = computeFeasibility(config.monthlyIncome, fixedExpenses, config.savingsGoal);
  const monthlyAllowances = computeCategoryMonthlyAllowances(feasibility.discretionaryBudget, config.categoryWeights);
  const cycleWindow = getCycleWindow(config.cycleStartDay, today);
  return { config, feasibility, monthlyAllowances, cycleWindow };
}

export function weightsSumTo100(weights: Record<CategoryId, number>): boolean {
  const sum = CATEGORY_IDS.reduce((total, category) => total + weights[category], 0);
  return sum === 100;
}

export function saveSetup(storage: StoragePort, config: PlanConfig, fixedExpenses: FixedExpenseItem[]): void {
  storage.setPlanConfig(config);
  storage.setFixedExpenses(fixedExpenses);
}
