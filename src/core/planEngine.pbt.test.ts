/** Property-based tests (fast-check) for PlanEngine — Partial PBT enforcement per
 * requirements.md NFR-4: PBT-03 (invariants) here. PBT-02 (round-trip) lives in
 * localStorageAdapter.pbt.test.ts. PBT-07 (generator quality) satisfied via
 * testGenerators.ts (domain generators, not raw primitives). PBT-08
 * (shrinking/reproducibility) and PBT-09 (framework selection) are satisfied by
 * fast-check itself: shrinking is on by default and any failure's console output
 * includes the seed needed to reproduce it — never disabled or suppressed here. */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  computeDiscretionaryBudget,
  computeFeasibility,
  computeProgress,
  computeRequiredMonthlyPace,
  computeSpendAggregates,
  getCycleWindow,
} from './planEngine';
import { genCycleStartDay, genExpenseEntries, genFixedExpenses, genIncome, genTargetAmount, genToday, isoOf } from './testGenerators';

describe('PlanEngine properties', () => {
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

  it('PBT-03: discretionaryBudget and requiredMonthlyPace are never negative', () => {
    const scenario = fc.tuple(genIncome(), genFixedExpenses(), genTargetAmount(), fc.float({ min: 0, max: Math.fround(1_000_000), noNaN: true }));
    fc.assert(
      fc.property(scenario, ([income, fixed, targetAmount, bankedTotal]) => {
        const pace = computeRequiredMonthlyPace(targetAmount, bankedTotal, '2030-01-01', new Date(2026, 0, 1));
        expect(pace).toBeGreaterThanOrEqual(0);

        const budget = computeDiscretionaryBudget(income, fixed, pace);
        expect(budget).toBeGreaterThanOrEqual(0);

        const feasibility = computeFeasibility(income, fixed, pace);
        expect(feasibility.discretionaryBudget).toBeGreaterThanOrEqual(0);
        expect(feasibility.shortfall).toBeGreaterThanOrEqual(0);
        expect(feasibility.largestFeasibleGoal).toBeGreaterThanOrEqual(0);
      }),
    );
  });

  it('PBT-03: requiredMonthlyPace is 0 once bankedTotal already meets or exceeds the target', () => {
    fc.assert(
      fc.property(genTargetAmount(), fc.float({ min: 0, max: Math.fround(10_000_000), noNaN: true }), (targetAmount, extra) => {
        const bankedTotal = targetAmount + extra;
        const pace = computeRequiredMonthlyPace(targetAmount, bankedTotal, '2030-01-01', new Date(2026, 0, 1));
        expect(pace).toBe(0);
      }),
    );
  });

  it('PBT-03: computeProgress.totalSavedSoFar always equals bankedTotal + this cycle\'s effective savings', () => {
    const scenario = fc
      .tuple(genIncome(), genTargetAmount(), fc.float({ min: 0, max: Math.fround(500_000), noNaN: true }), genToday())
      .chain(([discretionaryBudget, targetAmount, bankedTotal, today]) =>
        genExpenseEntries(isoOf(today), 10).map((entries) => ({ discretionaryBudget, targetAmount, bankedTotal, today, entries })),
      );

    fc.assert(
      fc.property(scenario, ({ discretionaryBudget, targetAmount, bankedTotal, today, entries }) => {
        const cycleWindow = getCycleWindow(1, today);
        const { totalThisCycle } = computeSpendAggregates(entries, cycleWindow, today);
        const progress = computeProgress(discretionaryBudget, bankedTotal, targetAmount, 0, entries, cycleWindow, today);
        expect(progress.totalSavedSoFar).toBeCloseTo(bankedTotal + (discretionaryBudget - totalThisCycle), 5);
      }),
    );
  });
});
