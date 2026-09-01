import { describe, expect, it } from 'vitest';
import {
  computeAllowanceBreakdown,
  computeCategoryMonthlyAllowances,
  computeDiscretionaryBudget,
  computeFeasibility,
  computeProgress,
  computeSpendAggregates,
  getCycleWindow,
} from './planEngine';
import type { CategoryWeights, ExpenseEntry, FixedExpenseItem } from './types';

const EQUAL_WEIGHTS: CategoryWeights = { food: 25, transport: 25, entertainment: 25, other: 25 };
const FIXED: FixedExpenseItem[] = [
  { id: '1', name: 'Rent', amount: 1000 },
  { id: '2', name: 'Insurance', amount: 100 },
];

function entry(overrides: Partial<ExpenseEntry> & Pick<ExpenseEntry, 'amount' | 'category' | 'date'>): ExpenseEntry {
  return { id: crypto.randomUUID(), ...overrides };
}

describe('computeDiscretionaryBudget', () => {
  it('subtracts fixed expenses and savings goal from income', () => {
    expect(computeDiscretionaryBudget(3000, FIXED, 500)).toBe(3000 - 1100 - 500);
  });

  it('floors at 0 when the plan is infeasible', () => {
    expect(computeDiscretionaryBudget(1000, FIXED, 500)).toBe(0);
  });
});

describe('computeFeasibility', () => {
  it('reports feasible with zero shortfall when income covers fixed + goal', () => {
    const result = computeFeasibility(3000, FIXED, 500);
    expect(result.feasible).toBe(true);
    expect(result.shortfall).toBe(0);
    expect(result.discretionaryBudget).toBe(1400);
    expect(result.largestFeasibleGoal).toBe(1900); // income - fixedTotal
  });

  it('reports infeasible with correct shortfall and largest feasible goal', () => {
    const result = computeFeasibility(1000, FIXED, 500);
    // fixedTotal=1100, savingsGoal=500 -> needed 1600, have 1000 -> shortfall 600
    expect(result.feasible).toBe(false);
    expect(result.shortfall).toBe(600);
    expect(result.largestFeasibleGoal).toBe(0); // income(1000) < fixedTotal(1100)
    expect(result.discretionaryBudget).toBe(0);
  });

  it('treats an exact break-even plan as feasible', () => {
    const result = computeFeasibility(1600, FIXED, 500);
    expect(result.feasible).toBe(true);
    expect(result.shortfall).toBe(0);
    expect(result.discretionaryBudget).toBe(0);
  });
});

describe('computeCategoryMonthlyAllowances', () => {
  it('splits the discretionary budget by weight and sums back to the total', () => {
    const weights: CategoryWeights = { food: 40, transport: 25, entertainment: 15, other: 20 };
    const allowances = computeCategoryMonthlyAllowances(1000, weights);
    expect(allowances.food).toBe(400);
    expect(allowances.transport).toBe(250);
    expect(allowances.entertainment).toBe(150);
    expect(allowances.other).toBe(200);
  });
});

describe('getCycleWindow', () => {
  it('produces a calendar-month cycle when cycleStartDay is 1', () => {
    const today = new Date(2026, 2, 15); // 2026-03-15
    const window = getCycleWindow(1, today);
    expect(window.start).toEqual(new Date(2026, 2, 1));
    expect(window.end).toEqual(new Date(2026, 2, 31));
    expect(window.totalDays).toBe(31);
    expect(window.dayIndex).toBe(15);
    expect(window.remainingDays).toBe(17);
  });

  it('produces a mid-month cycle spanning two calendar months when cycleStartDay > 1', () => {
    const today = new Date(2026, 2, 20); // 2026-03-20, cycle starts on the 15th
    const window = getCycleWindow(15, today);
    expect(window.start).toEqual(new Date(2026, 2, 15));
    expect(window.end).toEqual(new Date(2026, 3, 14));
  });

  it('rolls back to the previous month when today is before this month\'s start day', () => {
    const today = new Date(2026, 2, 10); // 2026-03-10, cycle starts on the 15th
    const window = getCycleWindow(15, today);
    expect(window.start).toEqual(new Date(2026, 1, 15)); // 2026-02-15
    expect(window.end).toEqual(new Date(2026, 2, 14));
  });

  it('clamps a start day beyond the month length (defensive; UI caps input at 28)', () => {
    const today = new Date(2026, 1, 27); // 2026-02-27, non-leap year
    const window = getCycleWindow(30, today);
    // candidate start this month clamps to Feb 28; today (27) is before that,
    // so the cycle rolls back to the previous month's clamped start (Jan 30).
    expect(window.start).toEqual(new Date(2026, 0, 30));
    expect(window.end).toEqual(new Date(2026, 1, 27));
  });

  it('floors remainingDays at 1 on the last day of the cycle', () => {
    const today = new Date(2026, 2, 31); // last day of a calendar-month cycle
    const window = getCycleWindow(1, today);
    expect(window.remainingDays).toBe(1);
  });
});

describe('computeSpendAggregates', () => {
  const window = getCycleWindow(1, new Date(2026, 2, 15));
  const entries: ExpenseEntry[] = [
    entry({ amount: 20, category: 'food', date: '2026-03-01' }),
    entry({ amount: 15, category: 'food', date: '2026-03-15' }), // today
    entry({ amount: 50, category: 'transport', date: '2026-02-20' }), // outside cycle
    entry({ amount: 5, category: 'other', date: '2026-04-02' }), // outside cycle
  ];

  it('sums only entries within the cycle window into spentThisCycle', () => {
    const { spentThisCycle } = computeSpendAggregates(entries, window, new Date(2026, 2, 15));
    expect(spentThisCycle.food).toBe(35);
    expect(spentThisCycle.transport).toBe(0);
    expect(spentThisCycle.other).toBe(0);
  });

  it('isolates today-only entries into spentToday', () => {
    const { spentToday } = computeSpendAggregates(entries, window, new Date(2026, 2, 15));
    expect(spentToday.food).toBe(15);
  });
});

describe('computeAllowanceBreakdown (live/shrinking daily allowance)', () => {
  it('reduces dailyAllowance immediately after an expense dated today is added', () => {
    const window = getCycleWindow(1, new Date(2026, 2, 1)); // day 1 of 31, remainingDays=31
    const before = computeAllowanceBreakdown(1000, EQUAL_WEIGHTS, [], window, new Date(2026, 2, 1));
    expect(before.food.dailyAllowance).toBeCloseTo(250 / 31, 5);

    const afterEntries: ExpenseEntry[] = [entry({ amount: 31, category: 'food', date: '2026-03-01' })];
    const after = computeAllowanceBreakdown(1000, EQUAL_WEIGHTS, afterEntries, window, new Date(2026, 2, 1));
    expect(after.food.dailyAllowance).toBeCloseTo((250 - 31) / 31, 5);
    expect(after.food.dailyAllowance).toBeLessThan(before.food.dailyAllowance);
  });

  it('never lets remainingBudget or dailyAllowance go negative when overspent', () => {
    const window = getCycleWindow(1, new Date(2026, 2, 1));
    const entries: ExpenseEntry[] = [entry({ amount: 9999, category: 'food', date: '2026-03-01' })];
    const breakdown = computeAllowanceBreakdown(1000, EQUAL_WEIGHTS, entries, window, new Date(2026, 2, 1));
    expect(breakdown.food.remainingBudget).toBe(0);
    expect(breakdown.food.dailyAllowance).toBe(0);
  });
});

describe('computeProgress', () => {
  it('reports hasGoal=false and null percentOfGoal when savingsGoal is 0', () => {
    const window = getCycleWindow(1, new Date(2026, 2, 15));
    const progress = computeProgress(1000, 0, [], window, new Date(2026, 2, 15));
    expect(progress.hasGoal).toBe(false);
    expect(progress.percentOfGoal).toBeNull();
    expect(progress.onTrack).toBeNull();
  });

  it('flags on-track as false with a positive projectedShortfall when overspending', () => {
    const window = getCycleWindow(1, new Date(2026, 2, 5)); // day 5 of 31
    const entries: ExpenseEntry[] = [entry({ amount: 500, category: 'food', date: '2026-03-01' })];
    // discretionaryBudget 1000, spent 500 by day 5 -> daily rate 100 -> projected total 3100, way over budget
    const progress = computeProgress(1000, 800, entries, window, new Date(2026, 2, 5));
    expect(progress.hasGoal).toBe(true);
    expect(progress.onTrack).toBe(false);
    expect(progress.projectedShortfall).toBeGreaterThan(0);
  });

  it('flags on-track as true when spend rate keeps projected savings at or above the goal', () => {
    const window = getCycleWindow(1, new Date(2026, 2, 5));
    const progress = computeProgress(1000, 100, [], window, new Date(2026, 2, 5));
    expect(progress.onTrack).toBe(true);
    expect(progress.projectedShortfall).toBe(0);
  });
});
