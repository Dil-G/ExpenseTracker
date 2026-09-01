import type { Category } from '../../core/types';
import type { AddExpenseInput } from '../services/trackingService';
import type { AddRecurringPaymentInput } from '../services/recurringService';

const NOTES = ['Groceries', 'Coffee', 'Bus fare', 'Movie night', 'Dinner out', 'Fuel', 'Subscription', 'Gift', 'Takeout', 'Utility top-up'];

/** Deterministic spread of expenses across August 2026 (1-2 per day, cycling through
 * whatever categories currently exist) - a one-click way to see Transactions/Overview
 * populated instead of empty. */
export function generateAugustDemoEntries(categories: Category[]): AddExpenseInput[] {
  if (categories.length === 0) return [];
  const entries: AddExpenseInput[] = [];
  let noteIndex = 0;
  for (let day = 1; day <= 31; day++) {
    const date = `2026-08-${String(day).padStart(2, '0')}`;
    const entriesToday = day % 5 === 0 ? 2 : 1;
    for (let i = 0; i < entriesToday; i++) {
      const category = categories[(day + i) % categories.length];
      const amount = 200 + ((day * 37 + i * 91) % 4000);
      entries.push({
        amount: Math.round(amount / 10) * 10,
        category: category.id,
        date,
        note: NOTES[noteIndex % NOTES.length],
      });
      noteIndex++;
    }
  }
  return entries;
}

function findCategory(categories: Category[], preferredNames: string[]): Category {
  for (const name of preferredNames) {
    const match = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (match) return match;
  }
  return categories[0];
}

/** A few realistic recurring payments (subscriptions/bills) to pair with the demo
 * expense history - matched to existing category names where possible, falling back
 * to the first category so this still works with a fully custom category list. */
export function generateDemoRecurringPayments(categories: Category[]): AddRecurringPaymentInput[] {
  if (categories.length === 0) return [];
  return [
    { name: 'Netflix Subscription', amount: 1500, dueDay: 5, categoryId: findCategory(categories, ['Entertainment']).id },
    { name: 'Claude Subscription', amount: 3400, dueDay: 12, categoryId: findCategory(categories, ['Other', 'Entertainment']).id },
    { name: 'Mobile Bill', amount: 2200, dueDay: 20, categoryId: findCategory(categories, ['Transport', 'Other']).id },
  ];
}
