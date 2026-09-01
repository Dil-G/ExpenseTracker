import { CATEGORY_IDS } from '../../core/types';
import type { AllowanceBreakdown } from '../../core/types';

export function CategoryBreakdown({ allowances }: { allowances: AllowanceBreakdown }) {
  return (
    <section className="category-breakdown" data-testid="category-breakdown">
      <h2>This Cycle</h2>
      <ul>
        {CATEGORY_IDS.map((category) => {
          const a = allowances[category];
          return (
            <li key={category} data-testid={`category-breakdown-${category}`}>
              <span className="category-name">{category}</span>
              <span>
                {a.spentThisCycle.toFixed(2)} / {a.monthlyAllowance.toFixed(2)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
