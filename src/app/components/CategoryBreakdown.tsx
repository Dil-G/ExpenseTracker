import type { Category, CategorySpendMap } from '../../core/types';
import { formatMoney } from '../utils/formatMoney';

interface Props {
  categories: Category[];
  categorySpend: CategorySpendMap;
  totalIncome: number;
}

/** Categories are spend-visibility only (CR2 Q2) - no per-category budget, limit, or
 * allowance. Each row is just "how much of my income went here this cycle". */
export function CategoryBreakdown({ categories, categorySpend, totalIncome }: Props) {
  return (
    <section className="category-breakdown" data-testid="category-breakdown">
      <h2>Spend by Category</h2>
      {categories.length === 0 && <p>No categories yet - add some in Settings.</p>}
      <ul>
        {categories.map((category) => {
          const spent = categorySpend[category.id] ?? 0;
          const ratio = totalIncome > 0 ? Math.min(spent / totalIncome, 1) : 0;
          return (
            <li key={category.id} data-testid={`category-breakdown-${category.id}`}>
              <div className="category-progress-row-header">
                <span className="category-name">{category.name}</span>
                <span className="num">
                  {formatMoney(spent)} / {formatMoney(totalIncome)}
                </span>
              </div>
              <div className="progress-bar-track progress-bar-track--sm">
                <div className="progress-bar-fill" style={{ width: `${ratio * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
