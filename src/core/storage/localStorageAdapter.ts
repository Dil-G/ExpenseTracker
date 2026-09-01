import { DEFAULT_CATEGORIES, type Category, type ExpenseEntry, type FixedExpenseItem, type Goal, type PlanConfig, type RecurringPayment, type SavingsLedgerState } from '../types';
import type { StoragePort } from './storagePort';

const KEYS = {
  planConfig: 'rollover:planConfig:v1',
  fixedExpenses: 'rollover:fixedExpenses:v1',
  expenseEntries: 'rollover:expenseEntries:v1',
  lastAdviceFetchAt: 'rollover:lastAdviceFetchAt:v1',
  categories: 'rollover:categories:v1',
  goal: 'rollover:goal:v1',
  savingsLedger: 'rollover:savingsLedger:v1',
  recurringPayments: 'rollover:recurringPayments:v1',
} as const;

const EMPTY_LEDGER: SavingsLedgerState = { bankedTotal: 0, lastBankedCycleStart: null };

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

  getCategories(): Category[] {
    const raw = window.localStorage.getItem(KEYS.categories);
    if (raw === null) {
      // First read ever: seed defaults so old ExpenseEntry.category values (which were
      // one of the old fixed ids) keep resolving with zero data migration.
      safeWrite(KEYS.categories, DEFAULT_CATEGORIES);
      return [...DEFAULT_CATEGORIES];
    }
    return safeRead<Category[]>(KEYS.categories, [...DEFAULT_CATEGORIES]);
  }

  setCategories(categories: Category[]): void {
    safeWrite(KEYS.categories, categories);
  }

  getGoal(): Goal | null {
    return safeRead<Goal | null>(KEYS.goal, null);
  }

  setGoal(goal: Goal): void {
    safeWrite(KEYS.goal, goal);
  }

  getSavingsLedger(): SavingsLedgerState {
    return safeRead<SavingsLedgerState>(KEYS.savingsLedger, EMPTY_LEDGER);
  }

  setSavingsLedger(ledger: SavingsLedgerState): void {
    safeWrite(KEYS.savingsLedger, ledger);
  }

  getRecurringPayments(): RecurringPayment[] {
    return safeRead<RecurringPayment[]>(KEYS.recurringPayments, []);
  }

  addRecurringPayment(payment: RecurringPayment): void {
    const payments = this.getRecurringPayments();
    payments.push(payment);
    safeWrite(KEYS.recurringPayments, payments);
  }

  updateRecurringPayment(id: string, patch: Partial<RecurringPayment>): void {
    const payments = this.getRecurringPayments().map((p) => (p.id === id ? { ...p, ...patch } : p));
    safeWrite(KEYS.recurringPayments, payments);
  }

  deleteRecurringPayment(id: string): void {
    const payments = this.getRecurringPayments().filter((p) => p.id !== id);
    safeWrite(KEYS.recurringPayments, payments);
  }
}
