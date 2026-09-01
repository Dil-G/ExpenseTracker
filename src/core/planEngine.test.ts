import { describe, expect, it } from 'vitest';
import {
  computeDiscretionaryBudget,
  computeFeasibility,
  computeProgress,
  computeRequiredMonthlyPace,
  computeSpendAggregates,
  getCycleWindow,
  updateSavingsLedger,
} from './planEngine';
import type { ExpenseEntry, FixedExpenseItem, Goal, SavingsLedgerState } from './types';

const FIXED: FixedExpenseItem[] = [
  { id: '1', name: 'Rent', amount: 1000 },
  { id: '2', name: 'Insurance', amount: 100 },
];

function entry(overrides: Partial<ExpenseEntry> & Pick<ExpenseEntry, 'amount' | 'category' | 'date'>): ExpenseEntry {
  return { id: crypto.randomUUID(), ...overrides };
}

describe('computeDiscretionaryBudget', () => {
  it('subtracts fixed expenses and the required monthly pace from income', () => {
    expect(computeDiscretionaryBudget(3000, FIXED, 500)).toBe(3000 - 1100 - 500);
  });

  it('floors at 0 when the plan is infeasible', () => {
    expect(computeDiscretionaryBudget(1000, FIXED, 500)).toBe(0);
  });
});

describe('computeFeasibility', () => {
  it('reports feasible with zero shortfall when income covers fixed + pace', () => {
    const result = computeFeasibility(3000, FIXED, 500);
    expect(result.feasible).toBe(true);
    expect(result.shortfall).toBe(0);
    expect(result.discretionaryBudget).toBe(1400);
    expect(result.largestFeasibleGoal).toBe(1900); // income - fixedTotal
  });

  it('reports infeasible with correct shortfall and largest feasible goal', () => {
    const result = computeFeasibility(1000, FIXED, 500);
    expect(result.feasible).toBe(false);
    expect(result.shortfall).toBe(600);
    expect(result.largestFeasibleGoal).toBe(0);
    expect(result.discretionaryBudget).toBe(0);
  });
});

describe('getCycleWindow', () => {
  it('produces a calendar-month cycle when cycleStartDay is 1', () => {
    const today = new Date(2026, 2, 15);
    const window = getCycleWindow(1, today);
    expect(window.start).toEqual(new Date(2026, 2, 1));
    expect(window.end).toEqual(new Date(2026, 2, 31));
    expect(window.totalDays).toBe(31);
    expect(window.dayIndex).toBe(15);
    expect(window.remainingDays).toBe(17);
  });

  it('floors remainingDays at 1 on the last day of the cycle', () => {
    const today = new Date(2026, 2, 31);
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

  it('sums only entries within the cycle window, per category and as a total', () => {
    const { spentThisCycle, totalThisCycle } = computeSpendAggregates(entries, window, new Date(2026, 2, 15));
    expect(spentThisCycle.food).toBe(35);
    expect(spentThisCycle.transport).toBeUndefined();
    expect(totalThisCycle).toBe(35);
  });

  it('isolates today-only entries', () => {
    const { spentToday, totalToday } = computeSpendAggregates(entries, window, new Date(2026, 2, 15));
    expect(spentToday.food).toBe(15);
    expect(totalToday).toBe(15);
  });
});

describe('computeRequiredMonthlyPace', () => {
  it('splits the remaining amount evenly across the remaining months', () => {
    // 6000 remaining, March 1 -> Sept 1 is 184 days (~6.13 months) -> ~978/month
    const pace = computeRequiredMonthlyPace(6000, 0, '2026-09-01', new Date(2026, 2, 1));
    expect(pace).toBeGreaterThan(900);
    expect(pace).toBeLessThan(1050);
  });

  it('returns 0 once the banked total already meets the target', () => {
    const pace = computeRequiredMonthlyPace(5000, 5000, '2026-09-01', new Date(2026, 2, 1));
    expect(pace).toBe(0);
  });

  it('spikes rather than divides by zero when the target date has already passed', () => {
    const pace = computeRequiredMonthlyPace(1000, 0, '2026-01-01', new Date(2026, 2, 1));
    expect(pace).toBeGreaterThan(1000); // overdue: whole remaining amount compressed into ~1 day
    expect(Number.isFinite(pace)).toBe(true);
  });
});

describe('updateSavingsLedger', () => {
  it('does not bank anything when the goal was just created this cycle', () => {
    const ledger: SavingsLedgerState = { bankedTotal: 0, lastBankedCycleStart: null };
    const goal: Goal = { targetAmount: 5000, targetDate: '2026-09-01', startDate: '2026-03-01' };
    const result = updateSavingsLedger(ledger, goal, 1, 3000, 1100, [], new Date(2026, 2, 15));
    expect(result.bankedTotal).toBe(0);
    expect(result.lastBankedCycleStart).toBeNull();
  });

  it('banks exactly one completed cycle when a month has passed', () => {
    const ledger: SavingsLedgerState = { bankedTotal: 0, lastBankedCycleStart: null };
    const goal: Goal = { targetAmount: 6000, targetDate: '2026-09-01', startDate: '2026-03-01' };
    // no entries logged in March -> full discretionary budget for that cycle gets banked
    const result = updateSavingsLedger(ledger, goal, 1, 3000, 1100, [], new Date(2026, 3, 15));
    expect(result.lastBankedCycleStart).toBe('2026-03-01');
    expect(result.bankedTotal).toBeGreaterThan(0);
  });

  it('banks multiple missed cycles in sequence, not just the most recent one', () => {
    const ledger: SavingsLedgerState = { bankedTotal: 0, lastBankedCycleStart: null };
    const goal: Goal = { targetAmount: 6000, targetDate: '2026-12-01', startDate: '2026-01-01' };
    const result = updateSavingsLedger(ledger, goal, 1, 3000, 1100, [], new Date(2026, 4, 15));
    // Jan, Feb, Mar, Apr all completed before May -> lastBanked should be April's start
    expect(result.lastBankedCycleStart).toBe('2026-04-01');
    expect(result.bankedTotal).toBeGreaterThan(0);
  });

  it('is a no-op (idempotent) when called again within the same current cycle', () => {
    const ledger: SavingsLedgerState = { bankedTotal: 0, lastBankedCycleStart: null };
    const goal: Goal = { targetAmount: 6000, targetDate: '2026-09-01', startDate: '2026-03-01' };
    const once = updateSavingsLedger(ledger, goal, 1, 3000, 1100, [], new Date(2026, 3, 15));
    const twice = updateSavingsLedger(once, goal, 1, 3000, 1100, [], new Date(2026, 3, 20));
    expect(twice).toEqual(once);
  });
});

describe('computeProgress', () => {
  it('reports hasGoal=false when targetAmount is 0', () => {
    const window = getCycleWindow(1, new Date(2026, 2, 15));
    const progress = computeProgress(1000, 0, 0, 0, [], window, new Date(2026, 2, 15));
    expect(progress.hasGoal).toBe(false);
    expect(progress.percentOfGoal).toBeNull();
    expect(progress.onTrack).toBeNull();
  });

  it('combines banked total with this cycle\'s effective savings for percentOfGoal', () => {
    const window = getCycleWindow(1, new Date(2026, 2, 15));
    // discretionaryBudget 1000, no spend -> this cycle contributes 1000; banked 2000 already
    const progress = computeProgress(1000, 2000, 6000, 500, [], window, new Date(2026, 2, 15));
    expect(progress.totalSavedSoFar).toBe(3000);
    expect(progress.percentOfGoal).toBeCloseTo(50, 5);
  });

  it('flags on-track as false when the projected cycle contribution misses the required pace', () => {
    const window = getCycleWindow(1, new Date(2026, 2, 5)); // day 5 of 31
    const entries: ExpenseEntry[] = [entry({ amount: 500, category: 'food', date: '2026-03-01' })];
    const progress = computeProgress(1000, 0, 6000, 800, entries, window, new Date(2026, 2, 5));
    expect(progress.onTrack).toBe(false);
    expect(progress.projectedShortfall).toBeGreaterThan(0);
  });

  it('flags on-track as true when the projected contribution meets the required pace', () => {
    const window = getCycleWindow(1, new Date(2026, 2, 5));
    const progress = computeProgress(1000, 0, 6000, 100, [], window, new Date(2026, 2, 5));
    expect(progress.onTrack).toBe(true);
    expect(progress.projectedShortfall).toBe(0);
  });
});
