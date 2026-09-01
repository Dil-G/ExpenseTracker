import { formatMoney } from '../utils/formatMoney';

/** Daily view (CR2 Q7): today's total spend only - there's no per-category or overall
 * daily allowance left to compare it against (Q2: the rollover/allowance mechanic was
 * removed entirely, categories are spend-visibility only). */
export function TodaySummary({ todaySpend }: { todaySpend: number }) {
  return (
    <section className="today-summary" data-testid="today-summary">
      <h2>Today</h2>
      <p>
        Spent today: <strong className="num">{formatMoney(todaySpend)}</strong>
      </p>
    </section>
  );
}
