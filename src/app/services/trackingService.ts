import { computeProgress, computeSpendAggregates } from '../../core/planEngine';
import type { CategorySpendMap, CycleWindow, ExpenseEntry, ProgressResult } from '../../core/types';
import type { StoragePort } from '../../core/storage/storagePort';

export function buildCategorySpend(entries: ExpenseEntry[], cycleWindow: CycleWindow, today: Date): CategorySpendMap {
  return computeSpendAggregates(entries, cycleWindow, today).spentThisCycle;
}

export function buildTodaySpend(entries: ExpenseEntry[], cycleWindow: CycleWindow, today: Date): number {
  return computeSpendAggregates(entries, cycleWindow, today).totalToday;
}

export function buildProgress(
  discretionaryBudget: number,
  bankedTotal: number,
  targetAmount: number,
  requiredMonthlyPace: number,
  entries: ExpenseEntry[],
  cycleWindow: CycleWindow,
  today: Date,
): ProgressResult {
  return computeProgress(discretionaryBudget, bankedTotal, targetAmount, requiredMonthlyPace, entries, cycleWindow, today);
}

export interface AddExpenseInput {
  amount: number;
  category: string;
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

export function updateExpense(storage: StoragePort, id: string, patch: Partial<ExpenseEntry>): void {
  storage.updateExpenseEntry(id, patch);
}

export function deleteExpense(storage: StoragePort, id: string): void {
  storage.deleteExpenseEntry(id);
}
