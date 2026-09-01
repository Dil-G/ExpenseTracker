import type { FeasibilityResult } from '../../core/types';

export function InfeasibilityBanner({ feasibility }: { feasibility: FeasibilityResult }) {
  if (feasibility.feasible) return null;
  return (
    <div className="infeasibility-banner" data-testid="infeasibility-banner" role="alert">
      <p>Your current plan doesn't add up: fixed expenses + savings goal exceed your income.</p>
      <p>
        Shortfall: {feasibility.shortfall.toFixed(2)} — largest feasible savings goal right now: {feasibility.largestFeasibleGoal.toFixed(2)}
      </p>
    </div>
  );
}
