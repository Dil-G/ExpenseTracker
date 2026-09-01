/** A category is user-defined (CR2) - `id` is stored on ExpenseEntry/RecurringPayment,
 * `name` is what's displayed. Default categories are seeded with ids matching the old
 * fixed CategoryId values ('food', 'transport', 'entertainment', 'other') so existing
 * stored ExpenseEntry.category values keep resolving with zero data migration. */
export interface Category {
  id: string;
  name: string;
}

export const DEFAULT_CATEGORIES: readonly Category[] = [
  { id: 'food', name: 'Food' },
  { id: 'transport', name: 'Transport' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'other', name: 'Other' },
];

/** A category id (foreign key into the stored Category list). Just a string - the fixed
 * union type is gone (CR2: categories are open/user-managed). */
export type CategoryId = string;

export interface PlanConfig {
  monthlyIncome: number;
  cycleStartDay: number; // 1-28
  currency: string;
}

/** Replaces the old flat monthly `savingsGoal` (CR2) - any target amount over any
 * duration, not just "this month". */
export interface Goal {
  targetAmount: number;
  targetDate: string; // ISO date
  startDate: string; // ISO date, set when the goal is created or edited
}

/** Persisted running total of savings banked from completed cycles, so goal progress
 * accumulates across cycle boundaries instead of resetting every cycle (CR2). */
export interface SavingsLedgerState {
  bankedTotal: number;
  lastBankedCycleStart: string | null; // ISO date
}

export interface FixedExpenseItem {
  id: string;
  name: string;
  amount: number;
}

/** New in CR2. Auto-logs an ExpenseEntry on its due day each cycle - unlike
 * FixedExpenseItem, it counts as ordinary category spend, not a pre-discretionary
 * deduction. */
export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1-28
  categoryId: string;
  lastAutoLoggedCycleStart: string | null; // ISO date
}

export interface ExpenseEntry {
  id: string;
  amount: number;
  category: CategoryId;
  date: string; // ISO date, YYYY-MM-DD
  note?: string;
}

export interface CycleWindow {
  start: Date;
  end: Date;
  dayIndex: number;
  totalDays: number;
  remainingDays: number;
}

export interface FeasibilityResult {
  feasible: boolean;
  discretionaryBudget: number;
  shortfall: number;
  largestFeasibleGoal: number;
}

/** Category spend is visibility-only in CR2 - no per-category allowance/limit/rollover,
 * just how much has been spent in that category this cycle. */
export type CategorySpendMap = Record<string, number>;

export interface ProgressResult {
  hasGoal: boolean;
  totalSavedSoFar: number; // bankedTotal + this cycle's effective savings
  percentOfGoal: number | null;
  requiredMonthlyPace: number; // derived monthly savings target, feeds discretionaryBudget
  projectedEndOfCycleSavings: number;
  onTrack: boolean | null;
  projectedShortfall: number;
  dailySpendRate: number;
}

export interface AdviceRequestPayload {
  income: number;
  fixedExpensesTotal: number;
  targetAmount: number;
  targetDate: string;
  requiredMonthlyPace: number;
  feasibility: FeasibilityResult;
  categorySpend: CategorySpendMap;
  progress: ProgressResult;
  currency: string;
}

export interface AdviceResponse {
  howToReachGoal: string;
  categoriesToTrim: Array<{ category: CategoryId; suggestedReductionAmount: number; reason: string }>;
  firstStep: string;
  tone: 'encouragement' | 'warning';
  message: string;
}
