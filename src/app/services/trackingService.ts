import { computeAllowanceBreakdown, computeProgress } from '../../core/planEngine';
import type { AllowanceBreakdown, CycleWindow, ExpenseEntry, FeasibilityResult, PlanConfig, ProgressResult } from '../../core/types';
import type { StoragePort } from '../../core/storage/storagePort';

export function buildAllowanceBreakdown(
  feasibility: FeasibilityResult,
  config: PlanConfig,
  entries: ExpenseEntry[],
  cycleWindow: CycleWindow,
  today: Date,
): AllowanceBreakdown {
  return computeAllowanceBreakdown(feasibility.discretionaryBudget, config.categoryWeights, entries, cycleWindow, today);
}

export function buildProgress(
  feasibility: FeasibilityResult,
  config: PlanConfig,
  entries: ExpenseEntry[],
  cycleWindow: CycleWindow,
  today: Date,
): ProgressResult {
  return computeProgress(feasibility.discretionaryBudget, config.savingsGoal, entries, cycleWindow, today);
}

export interface AddExpenseInput {
  amount: number;
  category: ExpenseEntry['category'];
  date: string;
  note?: string;
}

export function addExpense(storage: StoragePort, input: AddExpenseInput): ExpenseEntry {
  const entry: ExpenseEntry = {
    id: crypto.randomUUID(),
    amount: input.amount,
    category: input.category,
    date: input.date,
    note: input.note,
  };
  storage.addExpenseEntry(entry);
  return entry;
}
