import { CATEGORY_IDS } from '../../core/types';
import type { AllowanceBreakdown } from '../../core/types';
import { useAppState } from '../state/AppProvider';

export function TodaySummary({ allowances }: { allowances: AllowanceBreakdown }) {
  const { entries } = useAppState();
  const today = new Date().toISOString().slice(0, 10);
  const spentToday = entries.filter((e) => e.date === today).reduce((sum, e) => sum + e.amount, 0);
  const totalDailyAllowance = CATEGORY_IDS.reduce((sum, category) => sum + allowances[category].dailyAllowance, 0);

  return (
    <section className="today-summary" data-testid="today-summary">
      <h2>Today</h2>
      <p>
        Spent today: <strong>{spentToday.toFixed(2)}</strong> / allowance: <strong>{totalDailyAllowance.toFixed(2)}</strong>
      </p>
    </section>
  );
}
