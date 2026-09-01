/** Shared fast-check generators for domain types (PBT-07: domain-appropriate generators,
 * not raw primitives; centralized here so both planEngine.pbt.test.ts and
 * localStorageAdapter.pbt.test.ts reuse the same definitions). */
import fc from 'fast-check';
import type { Category, ExpenseEntry, FixedExpenseItem, Goal, PlanConfig } from './types';
import { toISODate } from './dateUtils';

/** Currency-safe amounts: generated as integer cents, converted to 2-decimal numbers,
 * to avoid the floating-point noise that a raw fc.float() would introduce into sum checks. */
export const genAmount = (maxCents = 1_000_000) =>
  fc.integer({ min: 0, max: maxCents }).map((cents) => cents / 100);

export const genPositiveAmount = (maxCents = 1_000_000) =>
  fc.integer({ min: 1, max: maxCents }).map((cents) => cents / 100);

export const genIncome = () => genAmount(2_000_000); // up to 20,000.00
export const genTargetAmount = () => genPositiveAmount(10_000_000); // up to 100,000.00
export const genCycleStartDay = () => fc.integer({ min: 1, max: 28 });

export const genCategoryId: fc.Arbitrary<string> = fc.constantFrom('food', 'transport', 'entertainment', 'other');

export const genCategory: fc.Arbitrary<Category> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
});

export const genFixedExpenseItem: fc.Arbitrary<FixedExpenseItem> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  amount: genAmount(500_000),
});

export const genFixedExpenses = (maxLength = 8) => fc.array(genFixedExpenseItem, { maxLength });

export const genPlanConfig: fc.Arbitrary<PlanConfig> = fc.record({
  monthlyIncome: genIncome(),
  cycleStartDay: genCycleStartDay(),
  currency: fc.constantFrom('USD', 'LKR', 'EUR', 'GBP'),
});

/** A "today" date within a fixed, realistic range — bounded so cycle-window arithmetic
 * stays within sane calendar years for the test run. */
export const genToday = () =>
  fc
    .date({ min: new Date(2024, 0, 1), max: new Date(2030, 11, 31), noInvalidDate: true })
    .map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()));

/** A target date some number of days after `today` — always in the future relative to it. */
export const genFutureTargetDate = (today: Date, maxDaysOut = 730) =>
  fc.integer({ min: 1, max: maxDaysOut }).map((days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return toISODate(d);
  });

export const genGoal = (today: Date): fc.Arbitrary<Goal> =>
  fc.tuple(genTargetAmount(), genFutureTargetDate(today)).map(([targetAmount, targetDate]) => ({
    targetAmount,
    targetDate,
    startDate: toISODate(today),
  }));

/** An expense entry dated on a specific ISO day (caller supplies the day so tests can
 * control whether it falls inside/outside a given cycle window). */
export const genExpenseEntryOnDate = (dateIso: string): fc.Arbitrary<ExpenseEntry> =>
  fc.record({
    id: fc.uuid(),
    amount: genPositiveAmount(200_000),
    category: genCategoryId,
    date: fc.constant(dateIso),
    note: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
  });

export const genExpenseEntries = (dateIso: string, maxLength = 10) =>
  fc.array(genExpenseEntryOnDate(dateIso), { maxLength });

export const isoOf = toISODate;
