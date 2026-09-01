import type { ExpenseEntry, FixedExpenseItem, PlanConfig } from '../types';
import type { StoragePort } from './storagePort';

const KEYS = {
  planConfig: 'rollover:planConfig:v1',
  fixedExpenses: 'rollover:fixedExpenses:v1',
  expenseEntries: 'rollover:expenseEntries:v1',
  lastAdviceFetchAt: 'rollover:lastAdviceFetchAt:v1',
} as const;

/** Never throws to callers (business-rules.md rule 6): a missing or corrupt value
 * resolves to the given default rather than propagating a parse error. */
function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[LocalStorageAdapter] Failed to read/parse "${key}"; using fallback.`);
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export class LocalStorageAdapter implements StoragePort {
  getPlanConfig(): PlanConfig | null {
    return safeRead<PlanConfig | null>(KEYS.planConfig, null);
  }

  setPlanConfig(config: PlanConfig): void {
    safeWrite(KEYS.planConfig, config);
  }

  getFixedExpenses(): FixedExpenseItem[] {
    return safeRead<FixedExpenseItem[]>(KEYS.fixedExpenses, []);
  }

  setFixedExpenses(items: FixedExpenseItem[]): void {
    safeWrite(KEYS.fixedExpenses, items);
  }

  getExpenseEntries(): ExpenseEntry[] {
    return safeRead<ExpenseEntry[]>(KEYS.expenseEntries, []);
  }

  addExpenseEntry(entry: ExpenseEntry): void {
    const entries = this.getExpenseEntries();
    entries.push(entry);
    safeWrite(KEYS.expenseEntries, entries);
  }

  updateExpenseEntry(id: string, patch: Partial<ExpenseEntry>): void {
    const entries = this.getExpenseEntries().map((e) => (e.id === id ? { ...e, ...patch } : e));
    safeWrite(KEYS.expenseEntries, entries);
  }

  deleteExpenseEntry(id: string): void {
    const entries = this.getExpenseEntries().filter((e) => e.id !== id);
    safeWrite(KEYS.expenseEntries, entries);
  }

  getLastAdviceFetchAt(): string | null {
    return safeRead<string | null>(KEYS.lastAdviceFetchAt, null);
  }

  setLastAdviceFetchAt(iso: string): void {
    safeWrite(KEYS.lastAdviceFetchAt, iso);
  }
}
