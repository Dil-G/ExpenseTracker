import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressPanel } from './ProgressPanel';
import type { AllowanceBreakdown, CycleWindow, ProgressResult } from '../../core/types';

const CYCLE_WINDOW: CycleWindow = {
  start: new Date(2026, 2, 1),
  end: new Date(2026, 2, 31),
  dayIndex: 18,
  totalDays: 31,
  remainingDays: 13,
};

const ALLOWANCES: AllowanceBreakdown = {
  food: { monthlyAllowance: 375, spentThisCycle: 220, remainingBudget: 155, dailyAllowance: 11.9 },
  transport: { monthlyAllowance: 375, spentThisCycle: 150, remainingBudget: 225, dailyAllowance: 17.3 },
  entertainment: { monthlyAllowance: 375, spentThisCycle: 300, remainingBudget: 75, dailyAllowance: 5.8 },
  other: { monthlyAllowance: 375, spentThisCycle: 90, remainingBudget: 285, dailyAllowance: 21.9 },
};

describe('ProgressPanel', () => {
  it('hides the progress bar and shows N/A when hasGoal is false', () => {
    const progress: ProgressResult = {
      hasGoal: false,
      effectiveSavings: 100,
      percentOfGoal: null,
      projectedEndOfCycleSavings: 100,
      onTrack: null,
      projectedShortfall: 0,
      dailySpendRate: 25,
    };
    render(<ProgressPanel progress={progress} cycleWindow={CYCLE_WINDOW} allowances={ALLOWANCES} savingsGoal={0} />);

    expect(screen.getByText('N/A - no goal set')).toBeInTheDocument();
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
    // category spend list still renders even without a savings goal
    expect(screen.getByTestId('category-progress-list')).toBeInTheDocument();
  });

  it('shows the progress bar and percentage when hasGoal is true', () => {
    const progress: ProgressResult = {
      hasGoal: true,
      effectiveSavings: 300,
      percentOfGoal: 60,
      projectedEndOfCycleSavings: 500,
      onTrack: true,
      projectedShortfall: 0,
      dailySpendRate: 40,
    };
    render(<ProgressPanel progress={progress} cycleWindow={CYCLE_WINDOW} allowances={ALLOWANCES} savingsGoal={500} />);

    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    // number is wrapped in its own <span class="num"> for tabular-figure styling, so the
    // full sentence is split across nodes - match against the panel's combined text content.
    expect(screen.getByTestId('progress-panel')).toHaveTextContent('60% of goal reached');
    expect(screen.getByTestId('pace-badge')).toHaveTextContent('Ahead of pace');
    expect(screen.queryByTestId('progress-projection-warning')).not.toBeInTheDocument();
  });

  it('shows a warning when projected to miss the goal', () => {
    const progress: ProgressResult = {
      hasGoal: true,
      effectiveSavings: -50,
      percentOfGoal: -10,
      projectedEndOfCycleSavings: -200,
      onTrack: false,
      projectedShortfall: 700,
      dailySpendRate: 90,
    };
    render(<ProgressPanel progress={progress} cycleWindow={CYCLE_WINDOW} allowances={ALLOWANCES} savingsGoal={800} />);

    expect(screen.getByTestId('progress-projection-warning')).toHaveTextContent('700.00');
    expect(screen.getByTestId('pace-badge')).toHaveTextContent('Behind pace');
  });

  it('flags a category as near its limit', () => {
    const progress: ProgressResult = {
      hasGoal: true,
      effectiveSavings: 300,
      percentOfGoal: 60,
      projectedEndOfCycleSavings: 500,
      onTrack: true,
      projectedShortfall: 0,
      dailySpendRate: 40,
    };
    render(<ProgressPanel progress={progress} cycleWindow={CYCLE_WINDOW} allowances={ALLOWANCES} savingsGoal={500} />);

    // entertainment is spent 300/375 = 80%, right at the near-limit threshold
    expect(screen.getByText(/near limit/)).toBeInTheDocument();
  });
});
