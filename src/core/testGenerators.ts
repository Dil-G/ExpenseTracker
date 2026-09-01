/** Shared fast-check generators for domain types (PBT-07: domain-appropriate generators,
 * not raw primitives; centralized here so both planEngine.pbt.test.ts and
 * localStorageAdapter.pbt.test.ts reuse the same definitions). */
import fc from 'fast-check';
import type { CategoryId, CategoryWeights, ExpenseEntry, FixedExpenseItem, PlanConfig } from './types';
import { toISODate } from './dateUtils';

/** Currency-safe amounts: generated as integer cents, converted to 2-decimal numbers,
 * to avoid the floating-point noise that a raw fc.float() would introduce into sum checks. */
export const genAmount = (maxCents = 1_000_000) =>
  fc.integer({ min: 0, max: maxCents }).map((cents) => cents / 100);

export const genPositiveAmount = (maxCents = 1_000_000) =>
  fc.integer({ min: 1, max: maxCents }).map((cents) => cents / 100);

export const genIncome = () => genAmount(2_000_000); // up to 20,000.00
export const genSavingsGoal = () => genAmount(1_000_000); // up to 10,000.00
export const genCycleStartDay = () => fc.integer({ min: 1, max: 28 });

export const genCategoryId: fc.Arbitrary<CategoryId> = fc.constantFrom(
  'food',
  'transport',
  'entertainment',
  'other',
);

/** Four non-negative integer weights that always sum to exactly 100 (stars-and-bars). */
export const genCategoryWeights: fc.Arbitrary<CategoryWeights> = fc
  .tuple(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }))
  .map(([a, b, c]) => {
    const [x, y, z] = [a, b, c].sort((p, q) => p - q);
    return { food: x, transport: y - x, entertainment: z - y, other: 100 - z };
  });

export const genFixedExpenseItem: fc.Arbitrary<FixedExpenseItem> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  amount: genAmount(500_000),
});

export const genFixedExpenses = (maxLength = 8) => fc.array(genFixedExpenseItem, { maxLength });

export const genPlanConfig: fc.Arbitrary<PlanConfig> = fc.record({
  monthlyIncome: genIncome(),
  savingsGoal: genSavingsGoal(),
  cycleStartDay: genCycleStartDay(),
  currency: fc.constantFrom('USD', 'LKR', 'EUR', 'GBP'),
  categoryWeights: genCategoryWeights,
});

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

/** A "today" date within a fixed, realistic range — bounded so cycle-window arithmetic
 * stays within sane calendar years for the test run. */
export const genToday = () =>
  fc
    .date({ min: new Date(2024, 0, 1), max: new Date(2030, 11, 31), noInvalidDate: true })
    .map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()));

export const isoOf = toISODate;
