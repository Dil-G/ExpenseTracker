import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressPanel } from './ProgressPanel';
import type { CycleWindow, Goal, ProgressResult } from '../../core/types';

const CYCLE_WINDOW: CycleWindow = {
  start: new Date(2026, 2, 1),
  end: new Date(2026, 2, 31),
  dayIndex: 18,
  totalDays: 31,
  remainingDays: 13,
};

const GOAL: Goal = { targetAmount: 5000, targetDate: '2026-09-01', startDate: '2026-01-01' };

describe('ProgressPanel', () => {
  it('shows N/A when there is no goal', () => {
    const progress: ProgressResult = {
      hasGoal: false,
      totalSavedSoFar: 100,
      percentOfGoal: null,
      requiredMonthlyPace: 0,
      projectedEndOfCycleSavings: 100,
      onTrack: null,
      projectedShortfall: 0,
      dailySpendRate: 25,
    };
    render(<ProgressPanel progress={progress} cycleWindow={CYCLE_WINDOW} goal={null} />);

    expect(screen.getByText('N/A - no goal set')).toBeInTheDocument();
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
  });

  it('shows the progress bar and percentage when a goal is set', () => {
    const progress: ProgressResult = {
      hasGoal: true,
      totalSavedSoFar: 300,
      percentOfGoal: 60,
      requiredMonthlyPace: 500,
      projectedEndOfCycleSavings: 500,
      onTrack: true,
      projectedShortfall: 0,
      dailySpendRate: 40,
    };
    render(<ProgressPanel progress={progress} cycleWindow={CYCLE_WINDOW} goal={GOAL} />);

    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    expect(screen.getByTestId('progress-panel')).toHaveTextContent('60% of goal reached');
    expect(screen.getByTestId('pace-badge')).toHaveTextContent('Ahead of pace');
    expect(screen.queryByTestId('progress-projection-warning')).not.toBeInTheDocument();
  });

  it('shows a warning when projected to miss this cycle\'s pace', () => {
    const progress: ProgressResult = {
      hasGoal: true,
      totalSavedSoFar: -50,
      percentOfGoal: -10,
      requiredMonthlyPace: 800,
      projectedEndOfCycleSavings: -200,
      onTrack: false,
      projectedShortfall: 700,
      dailySpendRate: 90,
    };
    render(<ProgressPanel progress={progress} cycleWindow={CYCLE_WINDOW} goal={GOAL} />);

    expect(screen.getByTestId('progress-projection-warning')).toHaveTextContent('700.00');
    expect(screen.getByTestId('pace-badge')).toHaveTextContent('Behind pace');
  });
});
