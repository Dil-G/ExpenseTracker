import type { CycleWindow, ExpenseEntry, RecurringPayment } from '../../core/types';
import type { StoragePort } from '../../core/storage/storagePort';
import { toISODate } from '../../core/dateUtils';

export interface AddRecurringPaymentInput {
  name: string;
  amount: number;
  dueDay: number;
  categoryId: string;
}

export function addRecurringPayment(storage: StoragePort, input: AddRecurringPaymentInput): RecurringPayment {
  const payment: RecurringPayment = {
    id: crypto.randomUUID(),
    name: input.name,
    amount: input.amount,
    dueDay: input.dueDay,
    categoryId: input.categoryId,
    lastAutoLoggedCycleStart: null,
  };
  storage.addRecurringPayment(payment);
  return payment;
}

export function updateRecurringPayment(storage: StoragePort, id: string, patch: Partial<RecurringPayment>): void {
  storage.updateRecurringPayment(id, patch);
}

export function deleteRecurringPayment(storage: StoragePort, id: string): void {
  storage.deleteRecurringPayment(id);
}

/** On app load: for each recurring payment whose due day has passed this cycle and
 * hasn't already been auto-logged this cycle, create an ExpenseEntry for it (CR2 Q4).
 * Mirrors the existing weekly-advice-check pattern — a plain "check on open" function,
 * no scheduler. Returns the newly created entries so the caller can merge them into
 * in-memory state without a second storage read. */
export function processRecurringPayments(
  storage: StoragePort,
  payments: RecurringPayment[],
  cycleWindow: CycleWindow,
  today: Date,
): ExpenseEntry[] {
  const todayDayOfMonth = today.getDate();
  const cycleStartIso = toISODate(cycleWindow.start);
  const newEntries: ExpenseEntry[] = [];

  for (const payment of payments) {
    if (todayDayOfMonth < payment.dueDay) continue;
    if (payment.lastAutoLoggedCycleStart === cycleStartIso) continue;

    const entry: ExpenseEntry = {
      id: crypto.randomUUID(),
      amount: payment.amount,
      category: payment.categoryId,
      date: toISODate(today),
      note: `Recurring: ${payment.name}`,
    };
    storage.addExpenseEntry(entry);
    storage.updateRecurringPayment(payment.id, { lastAutoLoggedCycleStart: cycleStartIso });
    newEntries.push(entry);
  }

  return newEntries;
}
