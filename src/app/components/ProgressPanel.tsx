import type { CycleWindow, Goal, ProgressResult } from '../../core/types';
import { formatMoney } from '../utils/formatMoney';
import { AlertIcon } from './icons';

interface Props {
  progress: ProgressResult;
  cycleWindow: CycleWindow;
  goal: Goal | null;
}

export function ProgressPanel({ progress, cycleWindow, goal }: Props) {
  if (!progress.hasGoal || !goal) {
    return (
      <section data-testid="progress-panel">
        <h2>Goal Progress</h2>
        <p>N/A - no goal set</p>
      </section>
    );
  }

  const clampedPercent = Math.max(0, Math.min(100, progress.percentOfGoal ?? 0));
  const isOverGoal = (progress.percentOfGoal ?? 0) >= 100;

  return (
    <section data-testid="progress-panel">
      <div className="progress-header">
        <span className="cycle-day-label">
          Day {cycleWindow.dayIndex} of {cycleWindow.totalDays}
        </span>
        {progress.onTrack !== null && (
          <span className={progress.onTrack ? 'pace-badge pace-badge--ahead' : 'pace-badge pace-badge--behind'} data-testid="pace-badge">
            {progress.onTrack ? 'Ahead of pace' : 'Behind pace'}
          </span>
        )}
      </div>

      <h1 className="progress-title">Goal Progress</h1>

      <div className="progress-goal-row">
        <span className="num progress-big-number">{formatMoney(progress.totalSavedSoFar)}</span>
        <span className="progress-goal-note">
          of <span className="num">{formatMoney(goal.targetAmount)}</span> by {goal.targetDate}
        </span>
      </div>

      <div className="progress-bar-track" data-testid="progress-bar">
        <div
          className={isOverGoal ? 'progress-bar-fill progress-bar-fill--over' : 'progress-bar-fill'}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>

      <div className="progress-percent-row">
        <span>
          <span className="num">{progress.percentOfGoal?.toFixed(0)}</span>% of goal reached
        </span>
        {isOverGoal ? (
          <span className="progress-percent-delta progress-percent-delta--over">
            +<span className="num">{((progress.percentOfGoal ?? 0) - 100).toFixed(0)}</span>% over goal
          </span>
        ) : (
          <span className="progress-percent-delta">
            <span className="num">{(100 - (progress.percentOfGoal ?? 0)).toFixed(0)}</span>% to goal
          </span>
        )}
      </div>

      <div className="stat-grid">
        <div className="stat-tile">
          <span className="stat-label">Days left</span>
          <span className="num stat-value">{cycleWindow.remainingDays}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Required pace</span>
          <span className="stat-value">
            <span className="num">{formatMoney(progress.requiredMonthlyPace)}</span> <span className="stat-value-suffix">/mo</span>
          </span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">This cycle</span>
          <span className="num stat-value">{formatMoney(progress.projectedEndOfCycleSavings)}</span>
        </div>
      </div>

      {progress.onTrack === false && (
        <p data-testid="progress-projection-warning" role="alert" className="advice-tone-warning progress-miss-warning">
          <AlertIcon width={16} height={16} /> On track to miss this cycle's pace by{' '}
          <span className="num">{formatMoney(progress.projectedShortfall)}</span>
        </p>
      )}
    </section>
  );
}
