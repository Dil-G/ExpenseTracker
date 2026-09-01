export type CategoryId = 'food' | 'transport' | 'entertainment' | 'other';

export const CATEGORY_IDS: readonly CategoryId[] = ['food', 'transport', 'entertainment', 'other'];

export interface CategoryWeights {
  food: number;
  transport: number;
  entertainment: number;
  other: number;
}

export interface PlanConfig {
  monthlyIncome: number;
  savingsGoal: number;
  cycleStartDay: number; // 1-28
  currency: string;
  categoryWeights: CategoryWeights;
}

export interface FixedExpenseItem {
  id: string;
  name: string;
  amount: number;
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

export interface CategoryAllowance {
  monthlyAllowance: number;
  spentThisCycle: number;
  remainingBudget: number;
  dailyAllowance: number;
}

export type AllowanceBreakdown = Record<CategoryId, CategoryAllowance>;

export interface ProgressResult {
  hasGoal: boolean;
  effectiveSavings: number;
  percentOfGoal: number | null;
  projectedEndOfCycleSavings: number;
  onTrack: boolean | null;
  projectedShortfall: number;
  dailySpendRate: number;
}

export interface AdviceRequestPayload {
  income: number;
  fixedExpensesTotal: number;
  savingsGoal: number;
  feasibility: FeasibilityResult;
  categoryAllowances: AllowanceBreakdown;
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
