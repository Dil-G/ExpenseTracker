import type { FeasibilityResult } from '../../core/types';
import { formatMoney } from '../utils/formatMoney';
import { AlertIcon } from './icons';

export function InfeasibilityBanner({ feasibility }: { feasibility: FeasibilityResult }) {
  if (feasibility.feasible) return null;
  return (
    <div className="infeasibility-banner" data-testid="infeasibility-banner" role="alert">
      <AlertIcon width={18} height={18} />
      <div>
        <p>Your current plan doesn't add up: fixed expenses plus savings goal exceed your income.</p>
        <p>
          Shortfall: <span className="num">{formatMoney(feasibility.shortfall)}</span> - largest feasible savings goal right now:{' '}
          <span className="num">{formatMoney(feasibility.largestFeasibleGoal)}</span>
        </p>
      </div>
    </div>
  );
}
