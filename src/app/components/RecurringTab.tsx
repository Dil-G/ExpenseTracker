import { useState } from 'react';
import { useAppState } from '../state/AppProvider';
import { formatMoney } from '../utils/formatMoney';
import { TrashIcon } from './icons';

export function RecurringTab() {
  const { categories, recurringPayments, addRecurringPayment, deleteRecurringPayment } = useAppState();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');

  const amountNum = Number(amount);
  const dueDayNum = Number(dueDay);
  const isValid = name.trim().length > 0 && amountNum > 0 && dueDayNum >= 1 && dueDayNum <= 28 && categoryId !== '';

  function add() {
    if (!isValid) return;
    addRecurringPayment({ name: name.trim(), amount: amountNum, dueDay: dueDayNum, categoryId });
    setName('');
    setAmount('');
    setDueDay('1');
  }

  function categoryName(id: string): string {
    return categories.find((c) => c.id === id)?.name ?? id;
  }

  return (
    <div className="tab-panel">
      <section className="card-section" data-testid="recurring-list">
        <h2>Recurring Payments</h2>
        <p>Auto-logged as a transaction each cycle once its due day passes.</p>
        {recurringPayments.length === 0 && <p>None yet.</p>}
        <ul className="fixed-expense-list">
          {recurringPayments.map((p) => (
            <li key={p.id} data-testid={`recurring-row-${p.id}`}>
              <span>
                {p.name} - <span className="num">{formatMoney(p.amount)}</span> on day {p.dueDay} ({categoryName(p.categoryId)})
              </span>
              <button type="button" className="icon-button" onClick={() => deleteRecurringPayment(p.id)} aria-label={`Delete ${p.name}`}>
                <TrashIcon width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-section" data-testid="recurring-add-form">
        <h2>Add Recurring Payment</h2>
        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} data-testid="recurring-name-input" />
        </label>
        <label>
          Amount
          <input type="number" inputMode="decimal" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="recurring-amount-input" />
        </label>
        <label>
          Due day (1-28)
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={28}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            data-testid="recurring-due-day-input"
          />
        </label>
        <label>
          Category
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} data-testid="recurring-category-select">
            {categories.length === 0 && <option value="">No categories yet</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" disabled={!isValid} onClick={add} data-testid="recurring-add-button">
          Add
        </button>
      </section>
    </div>
  );
}
