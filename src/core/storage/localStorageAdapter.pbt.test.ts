/** PBT-02 round-trip property: write(x) -> read() must reproduce x exactly, for any
 * valid generated PlanConfig / FixedExpenseItem[] / ExpenseEntry[]. Uses the shared
 * domain generators from testGenerators.ts (PBT-07). */
import fc from 'fast-check';
import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStorageAdapter } from './localStorageAdapter';
import { genFixedExpenses, genExpenseEntries, genGoal, genPlanConfig, genToday } from '../testGenerators';

describe('LocalStorageAdapter round-trip properties', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    window.localStorage.clear();
    adapter = new LocalStorageAdapter();
  });

  it('PBT-02: PlanConfig round-trips through write/read unchanged', () => {
    fc.assert(
      fc.property(genPlanConfig, (config) => {
        adapter.setPlanConfig(config);
        expect(adapter.getPlanConfig()).toEqual(config);
      }),
    );
  });

  it('PBT-02: FixedExpenseItem[] round-trips through write/read unchanged', () => {
    fc.assert(
      fc.property(genFixedExpenses(10), (items) => {
        adapter.setFixedExpenses(items);
        expect(adapter.getFixedExpenses()).toEqual(items);
      }),
    );
  });

  it('PBT-02: ExpenseEntry[] round-trips through the public add-entry path unchanged', () => {
    fc.assert(
      fc.property(genExpenseEntries('2026-03-01', 10), (entries) => {
        window.localStorage.clear(); // entries accumulate via addExpenseEntry, so isolate each run explicitly
        for (const entry of entries) adapter.addExpenseEntry(entry);
        expect(adapter.getExpenseEntries()).toEqual(entries);
      }),
    );
  });

  it('PBT-02: Goal round-trips through write/read unchanged', () => {
    fc.assert(
      fc.property(genToday().chain((today) => genGoal(today)), (goal) => {
        adapter.setGoal(goal);
        expect(adapter.getGoal()).toEqual(goal);
      }),
    );
  });
});
