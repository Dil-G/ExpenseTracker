import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageAdapter } from './localStorageAdapter';
import type { ExpenseEntry, Goal, PlanConfig, RecurringPayment } from '../types';

const CONFIG: PlanConfig = {
  monthlyIncome: 3000,
  cycleStartDay: 1,
  currency: 'USD',
};

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    window.localStorage.clear();
    adapter = new LocalStorageAdapter();
  });

  it('returns null for a missing PlanConfig rather than throwing', () => {
    expect(adapter.getPlanConfig()).toBeNull();
  });

  it('returns an empty array for missing FixedExpenses/ExpenseEntries', () => {
    expect(adapter.getFixedExpenses()).toEqual([]);
    expect(adapter.getExpenseEntries()).toEqual([]);
  });

  it('returns the fallback (not a throw) when stored data is corrupt JSON', () => {
    window.localStorage.setItem('rollover:planConfig:v1', 'not valid json{{{');
    expect(() => adapter.getPlanConfig()).not.toThrow();
    expect(adapter.getPlanConfig()).toBeNull();
  });

  it('persists and retrieves a PlanConfig', () => {
    adapter.setPlanConfig(CONFIG);
    expect(adapter.getPlanConfig()).toEqual(CONFIG);
  });

  it('adds, updates, and deletes expense entries', () => {
    const entry: ExpenseEntry = { id: 'e1', amount: 12.5, category: 'food', date: '2026-03-01' };
    adapter.addExpenseEntry(entry);
    expect(adapter.getExpenseEntries()).toEqual([entry]);

    adapter.updateExpenseEntry('e1', { amount: 20 });
    expect(adapter.getExpenseEntries()[0].amount).toBe(20);

    adapter.deleteExpenseEntry('e1');
    expect(adapter.getExpenseEntries()).toEqual([]);
  });

  it('persists lastAdviceFetchAt', () => {
    expect(adapter.getLastAdviceFetchAt()).toBeNull();
    adapter.setLastAdviceFetchAt('2026-03-01T00:00:00.000Z');
    expect(adapter.getLastAdviceFetchAt()).toBe('2026-03-01T00:00:00.000Z');
  });

  it('seeds default categories on first read (migration path for old fixed CategoryId values)', () => {
    const categories = adapter.getCategories();
    expect(categories.map((c) => c.id).sort()).toEqual(['entertainment', 'food', 'other', 'transport']);
    // seeding is persisted, not re-generated every read
    expect(window.localStorage.getItem('rollover:categories:v1')).not.toBeNull();
  });

  it('does not overwrite categories that were already customized', () => {
    adapter.setCategories([{ id: 'custom-1', name: 'Custom' }]);
    expect(adapter.getCategories()).toEqual([{ id: 'custom-1', name: 'Custom' }]);
  });

  it('persists and retrieves a Goal', () => {
    const goal: Goal = { targetAmount: 500000, targetDate: '2027-01-01', startDate: '2026-07-01' };
    expect(adapter.getGoal()).toBeNull();
    adapter.setGoal(goal);
    expect(adapter.getGoal()).toEqual(goal);
  });

  it('defaults the savings ledger to zero/unbanked when nothing is stored', () => {
    expect(adapter.getSavingsLedger()).toEqual({ bankedTotal: 0, lastBankedCycleStart: null });
  });

  it('persists the savings ledger', () => {
    adapter.setSavingsLedger({ bankedTotal: 1200, lastBankedCycleStart: '2026-06-01' });
    expect(adapter.getSavingsLedger()).toEqual({ bankedTotal: 1200, lastBankedCycleStart: '2026-06-01' });
  });

  it('adds, updates, and deletes recurring payments', () => {
    const payment: RecurringPayment = {
      id: 'r1',
      name: 'Netflix',
      amount: 15,
      dueDay: 5,
      categoryId: 'entertainment',
      lastAutoLoggedCycleStart: null,
    };
    adapter.addRecurringPayment(payment);
    expect(adapter.getRecurringPayments()).toEqual([payment]);

    adapter.updateRecurringPayment('r1', { amount: 18 });
    expect(adapter.getRecurringPayments()[0].amount).toBe(18);

    adapter.deleteRecurringPayment('r1');
    expect(adapter.getRecurringPayments()).toEqual([]);
  });
});
