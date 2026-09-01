import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageAdapter } from './localStorageAdapter';
import type { ExpenseEntry, PlanConfig } from '../types';

const CONFIG: PlanConfig = {
  monthlyIncome: 3000,
  savingsGoal: 500,
  cycleStartDay: 1,
  currency: 'USD',
  categoryWeights: { food: 40, transport: 25, entertainment: 15, other: 20 },
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
});
