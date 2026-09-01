import { CATEGORY_IDS } from '../../core/types';
import type { AllowanceBreakdown, CycleWindow, ProgressResult } from '../../core/types';
import { formatMoney } from '../utils/formatMoney';
import { AlertIcon } from './icons';

const NEAR_LIMIT_RATIO = 0.8;

interface Props {
  progress: ProgressResult;
  cycleWindow: CycleWindow;
  allowances: AllowanceBreakdown;
  savingsGoal: number;
}

function CategorySpendList({ allowances }: { allowances: AllowanceBreakdown }) {
  return (
    <section data-testid="category-progress-list">
      <h2>Category spend vs. allocation</h2>
      <ul className="category-progress-list">
        {CATEGORY_IDS.map((category) => {
          const a = allowances[category];
          const ratio = a.monthlyAllowance > 0 ? a.spentThisCycle / a.monthlyAllowance : 0;
          const nearLimit = ratio >= NEAR_LIMIT_RATIO && ratio < 1;
          const overLimit = ratio >= 1;
          return (
            <li key={category} className="category-progress-row">
              <div className="category-progress-row-header">
                <span className="category-name">{category}</span>
                <span className={overLimit ? 'num advice-tone-warning' : nearLimit ? 'num advice-tone-warning' : 'num'}>
                  {formatMoney(a.spentThisCycle)} / {formatMoney(a.monthlyAllowance)}
                  {nearLimit && ' · near limit'}
                  {overLimit && ' · over limit'}
                </span>
              </div>
              <div className="progress-bar-track progress-bar-track--sm">
                <div
                  className={overLimit || nearLimit ? 'progress-bar-fill progress-bar-fill--warning' : 'progress-bar-fill'}
                  style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ProgressPanel({ progress, cycleWindow, allowances, savingsGoal }: Props) {
  if (!progress.hasGoal) {
    return (
      <>
        <section data-testid="progress-panel">
          <h2>Progress</h2>
          <p>N/A - no goal set</p>
        </section>
        <CategorySpendList allowances={allowances} />
      </>
    );
  }

  const clampedPercent = Math.max(0, Math.min(100, progress.percentOfGoal ?? 0));
  const isOverGoal = (progress.percentOfGoal ?? 0) >= 100;

  return (
    <>
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

        <h1 className="progress-title">Progress</h1>

        <div className="progress-goal-row">
          <span className="num progress-big-number">{formatMoney(progress.effectiveSavings)}</span>
          <span className="progress-goal-note">
            of <span className="num">{formatMoney(savingsGoal)}</span> goal
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
            <span className="stat-label">Daily pace</span>
            <span className="stat-value">
              <span className="num">{formatMoney(progress.dailySpendRate)}</span> <span className="stat-value-suffix">/day</span>
            </span>
          </div>
          <div className="stat-tile">
            <span className="stat-label">Projected EOC</span>
            <span className="num stat-value">{formatMoney(progress.projectedEndOfCycleSavings)}</span>
          </div>
        </div>

        {progress.onTrack === false && (
          <p data-testid="progress-projection-warning" role="alert" className="advice-tone-warning progress-miss-warning">
            <AlertIcon width={16} height={16} /> On track to miss your goal by <span className="num">{formatMoney(progress.projectedShortfall)}</span>
          </p>
        )}
      </section>

      <CategorySpendList allowances={allowances} />
    </>
  );
}
