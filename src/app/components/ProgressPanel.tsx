import type { ProgressResult } from '../../core/types';
import { AlertIcon } from './icons';

export function ProgressPanel({ progress }: { progress: ProgressResult }) {
  if (!progress.hasGoal) {
    return (
      <section data-testid="progress-panel">
        <h2>Progress</h2>
        <p>N/A - no goal set</p>
      </section>
    );
  }

  return (
    <section data-testid="progress-panel">
      <h2>Progress</h2>
      <p>
        Effective savings so far: <span className="num">{progress.effectiveSavings.toFixed(2)}</span>
      </p>
      <p>
        <span className="num">{progress.percentOfGoal?.toFixed(1)}</span>% of goal reached
      </p>
      <div className="progress-bar-track" data-testid="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.max(0, Math.min(100, progress.percentOfGoal ?? 0))}%` }}
        />
      </div>
      <p>
        Projected end-of-cycle savings: <span className="num">{progress.projectedEndOfCycleSavings.toFixed(2)}</span>
      </p>
      {progress.onTrack === false && (
        <p data-testid="progress-projection-warning" role="alert" className="advice-tone-warning">
          <AlertIcon width={16} height={16} /> On track to miss your goal by{' '}
          <span className="num">{progress.projectedShortfall.toFixed(2)}</span>
        </p>
      )}
    </section>
  );
}
