import type { ProgressResult } from '../../core/types';

export function ProgressPanel({ progress }: { progress: ProgressResult }) {
  if (!progress.hasGoal) {
    return (
      <section data-testid="progress-panel">
        <h2>Progress</h2>
        <p>N/A — no goal set</p>
      </section>
    );
  }

  return (
    <section data-testid="progress-panel">
      <h2>Progress</h2>
      <p>Effective savings so far: {progress.effectiveSavings.toFixed(2)}</p>
      <p>{progress.percentOfGoal?.toFixed(1)}% of goal reached</p>
      <div className="progress-bar-track" data-testid="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.max(0, Math.min(100, progress.percentOfGoal ?? 0))}%` }}
        />
      </div>
      <p>Projected end-of-cycle savings: {progress.projectedEndOfCycleSavings.toFixed(2)}</p>
      {progress.onTrack === false && (
        <p data-testid="progress-projection-warning" role="alert">
          On track to miss your goal by {progress.projectedShortfall.toFixed(2)}
        </p>
      )}
    </section>
  );
}
