import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressPanel } from './ProgressPanel';
import type { ProgressResult } from '../../core/types';

describe('ProgressPanel', () => {
  it('hides the progress bar and shows N/A when hasGoal is false', () => {
    const progress: ProgressResult = {
      hasGoal: false,
      effectiveSavings: 100,
      percentOfGoal: null,
      projectedEndOfCycleSavings: 100,
      onTrack: null,
      projectedShortfall: 0,
    };
    render(<ProgressPanel progress={progress} />);

    expect(screen.getByText('N/A — no goal set')).toBeInTheDocument();
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
  });

  it('shows the progress bar and percentage when hasGoal is true', () => {
    const progress: ProgressResult = {
      hasGoal: true,
      effectiveSavings: 300,
      percentOfGoal: 60,
      projectedEndOfCycleSavings: 500,
      onTrack: true,
      projectedShortfall: 0,
    };
    render(<ProgressPanel progress={progress} />);

    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    expect(screen.getByText('60.0% of goal reached')).toBeInTheDocument();
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
    };
    render(<ProgressPanel progress={progress} />);

    expect(screen.getByTestId('progress-projection-warning')).toHaveTextContent('700.00');
  });
});
