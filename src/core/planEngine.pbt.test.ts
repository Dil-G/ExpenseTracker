/** Property-based tests (fast-check) for PlanEngine — Partial PBT enforcement per
 * requirements.md NFR-4: PBT-03 (invariants) here. PBT-02 (round-trip) lives in
 * localStorageAdapter.pbt.test.ts. PBT-07 (generator quality) satisfied via
 * testGenerators.ts (domain generators, not raw primitives). PBT-08
 * (shrinking/reproducibility) and PBT-09 (framework selection) are satisfied by
 * fast-check itself: shrinking is on by default and any failure's console output
 * includes the seed needed to reproduce it — never disabled or suppressed here. */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { computeAllowanceBreakdown, computeCategoryMonthlyAllowances, computeDiscretionaryBudget, getCycleWindow } from './planEngine';
import { CATEGORY_IDS } from './types';
import { genCategoryWeights, genExpenseEntries, genFixedExpenses, genIncome, genSavingsGoal, genCycleStartDay, genToday, isoOf } from './testGenerators';

describe('PlanEngine properties', () => {
  it('PBT-03: category monthly allowances always sum back to the discretionary budget', () => {
    fc.assert(
      fc.property(genIncome(), genFixedExpenses(), genSavingsGoal(), genCategoryWeights, (income, fixed, goal, weights) => {
        const budget = computeDiscretionaryBudget(income, fixed, goal);
        const allowances = computeCategoryMonthlyAllowances(budget, weights);
        const sum = CATEGORY_IDS.reduce((total, category) => total + allowances[category], 0);
        expect(Math.abs(sum - budget)).toBeLessThan(0.01);
      }),
    );
  });

  it('PBT-03: category monthly allowances are never negative', () => {
    fc.assert(
      fc.property(genIncome(), genFixedExpenses(), genSavingsGoal(), genCategoryWeights, (income, fixed, goal, weights) => {
        const budget = computeDiscretionaryBudget(income, fixed, goal);
        const allowances = computeCategoryMonthlyAllowances(budget, weights);
        for (const category of CATEGORY_IDS) {
          expect(allowances[category]).toBeGreaterThanOrEqual(0);
        }
      }),
    );
  });

  it('PBT-03: remainingBudget and dailyAllowance are never negative, however much is spent', () => {
    const scenario = fc
      .tuple(genIncome(), genFixedExpenses(), genSavingsGoal(), genCategoryWeights, genToday())
      .chain(([income, fixed, goal, weights, today]) =>
        genExpenseEntries(isoOf(today), 15).map((entries) => ({ income, fixed, goal, weights, today, entries })),
      );

    fc.assert(
      fc.property(scenario, ({ income, fixed, goal, weights, today, entries }) => {
        const cycleWindow = getCycleWindow(1, today);
        const budget = computeDiscretionaryBudget(income, fixed, goal);
        const breakdown = computeAllowanceBreakdown(budget, weights, entries, cycleWindow, today);
        for (const category of CATEGORY_IDS) {
          expect(breakdown[category].remainingBudget).toBeGreaterThanOrEqual(0);
          expect(breakdown[category].dailyAllowance).toBeGreaterThanOrEqual(0);
        }
      }),
    );
  });

  it('PBT-03: cycle window invariants hold for any valid cycleStartDay and date', () => {
    fc.assert(
      fc.property(genCycleStartDay(), genToday(), (cycleStartDay, today) => {
        const window = getCycleWindow(cycleStartDay, today);
        expect(window.totalDays).toBeGreaterThanOrEqual(28);
        expect(window.remainingDays).toBeGreaterThanOrEqual(1);
        expect(window.dayIndex).toBeGreaterThanOrEqual(1);
        expect(window.dayIndex).toBeLessThanOrEqual(window.totalDays);
        expect(window.start.getTime()).toBeLessThanOrEqual(today.getTime());
        expect(window.end.getTime()).toBeGreaterThanOrEqual(today.getTime());
      }),
    );
  });
});
