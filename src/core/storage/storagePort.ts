import type { ExpenseEntry, FixedExpenseItem, PlanConfig } from '../types';

/** Persistence abstraction. Nothing outside this interface (and its localStorage
 * implementation) knows how or where data is actually stored — this is the seam that
 * keeps a future cloud-sync backend swap (backlog item) from touching call sites. */
export interface StoragePort {
  getPlanConfig(): PlanConfig | null;
  setPlanConfig(config: PlanConfig): void;

  getFixedExpenses(): FixedExpenseItem[];
  setFixedExpenses(items: FixedExpenseItem[]): void;

  getExpenseEntries(): ExpenseEntry[];
  addExpenseEntry(entry: ExpenseEntry): void;
  updateExpenseEntry(id: string, patch: Partial<ExpenseEntry>): void;
  deleteExpenseEntry(id: string): void;

  getLastAdviceFetchAt(): string | null;
  setLastAdviceFetchAt(iso: string): void;
}
