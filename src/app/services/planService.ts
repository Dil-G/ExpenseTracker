import { computeFeasibility, computeRequiredMonthlyPace, getCycleWindow, updateSavingsLedger } from '../../core/planEngine';
import type { CycleWindow, ExpenseEntry, FeasibilityResult, FixedExpenseItem, Goal, PlanConfig, SavingsLedgerState } from '../../core/types';
import type { StoragePort } from '../../core/storage/storagePort';

export interface PlanView {
  config: PlanConfig | null;
  goal: Goal | null;
  feasibility: FeasibilityResult | null;
  cycleWindow: CycleWindow | null;
  requiredMonthlyPace: number;
  bankedTotal: number;
}

function sumFixedExpenses(fixedExpenses: FixedExpenseItem[]): number {
  return fixedExpenses.reduce((total, item) => total + item.amount, 0);
}

export function buildPlanView(
  config: PlanConfig | null,
  goal: Goal | null,
  fixedExpenses: FixedExpenseItem[],
  ledger: SavingsLedgerState,
  today: Date,
): PlanView {
  if (!config) {
    return { config: null, goal: null, feasibility: null, cycleWindow: null, requiredMonthlyPace: 0, bankedTotal: 0 };
  }
  const cycleWindow = getCycleWindow(config.cycleStartDay, today);
  const requiredMonthlyPace = goal ? computeRequiredMonthlyPace(goal.targetAmount, ledger.bankedTotal, goal.targetDate, today) : 0;
  const feasibility = computeFeasibility(config.monthlyIncome, fixedExpenses, requiredMonthlyPace);
  return { config, goal, feasibility, cycleWindow, requiredMonthlyPace, bankedTotal: ledger.bankedTotal };
}

export function saveSetup(storage: StoragePort, config: PlanConfig, fixedExpenses: FixedExpenseItem[]): void {
  storage.setPlanConfig(config);
  storage.setFixedExpenses(fixedExpenses);
}

export function saveGoal(storage: StoragePort, goal: Goal): void {
  storage.setGoal(goal);
}

/** Banks any cycles that completed since the ledger was last checked (CR2 — persisted
 * savings history across cycle boundaries). No-op if nothing changed, so it's safe to
 * call on every app load without writing to storage unnecessarily. */
export function refreshSavingsLedger(
  storage: StoragePort,
  config: PlanConfig,
  goal: Goal,
  fixedExpenses: FixedExpenseItem[],
  entries: ExpenseEntry[],
  today: Date,
): SavingsLedgerState {
  const current = storage.getSavingsLedger();
  const updated = updateSavingsLedger(current, goal, config.cycleStartDay, config.monthlyIncome, sumFixedExpenses(fixedExpenses), entries, today);
  if (updated.bankedTotal !== current.bankedTotal || updated.lastBankedCycleStart !== current.lastBankedCycleStart) {
    storage.setSavingsLedger(updated);
  }
  return updated;
}
