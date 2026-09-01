import { useMemo, useState } from 'react';
import { useAppState } from '../state/AppProvider';
import { formatMoney } from '../utils/formatMoney';
import { PencilIcon, TrashIcon } from './icons';
import { DateInput } from './DateInput';
import type { ExpenseEntry } from '../../core/types';

function EditRow({ entry, onDone }: { entry: ExpenseEntry; onDone: () => void }) {
  const { categories, updateExpense } = useAppState();
  const [amount, setAmount] = useState(String(entry.amount));
  const [category, setCategory] = useState(entry.category);
  const [date, setDate] = useState(entry.date);
  const [note, setNote] = useState(entry.note ?? '');

  const amountNum = Number(amount);
  const isValid = amount !== '' && amountNum > 0;

  function save() {
    if (!isValid) return;
    updateExpense(entry.id, { amount: amountNum, category, date, note: note.trim() || undefined });
    onDone();
  }

  return (
    <li className="transaction-row transaction-row--editing" data-testid={`transaction-edit-row-${entry.id}`}>
      <input type="number" inputMode="decimal" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="transaction-edit-amount-input" />
      <select value={category} onChange={(e) => setCategory(e.target.value)} data-testid="transaction-edit-category-select">
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <DateInput value={date} onChange={(e) => setDate(e.target.value)} data-testid="transaction-edit-date-input" />
      <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" data-testid="transaction-edit-note-input" />
      <div className="sheet-actions">
        <button type="button" className="button-secondary" onClick={onDone}>
          Cancel
        </button>
        <button type="button" disabled={!isValid} onClick={save} data-testid="transaction-edit-save-button">
          Save
        </button>
      </div>
    </li>
  );
}

export function TransactionsTab() {
  const { entries, categories, deleteExpense } = useAppState();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  function categoryName(id: string): string {
    return categories.find((c) => c.id === id)?.name ?? id;
  }

  const filtered = useMemo(() => {
    return entries
      .filter((e) => categoryFilter === 'all' || e.category === categoryFilter)
      .filter((e) => !dateFrom || e.date >= dateFrom)
      .filter((e) => !dateTo || e.date <= dateTo)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [entries, categoryFilter, dateFrom, dateTo]);

  return (
    <div className="tab-panel">
      <section className="card-section" data-testid="transactions-filters">
        <h2>Transactions</h2>
        <div className="transactions-filter-row">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} data-testid="transactions-category-filter">
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <DateInput value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="From date" data-testid="transactions-date-from" />
          <DateInput value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="To date" data-testid="transactions-date-to" />
        </div>
      </section>

      <section className="card-section" data-testid="transactions-list">
        {filtered.length === 0 && <p>No transactions match.</p>}
        <ul className="transaction-list">
          {filtered.map((entry) =>
            editingId === entry.id ? (
              <EditRow key={entry.id} entry={entry} onDone={() => setEditingId(null)} />
            ) : (
              <li key={entry.id} className="transaction-row" data-testid={`transaction-row-${entry.id}`}>
                <div className="transaction-row-main">
                  <span className="category-name">{categoryName(entry.category)}</span>
                  <span className="num">{formatMoney(entry.amount)}</span>
                </div>
                <div className="transaction-row-meta">
                  <span>{entry.date}</span>
                  {entry.note && <span className="transaction-note">{entry.note}</span>}
                </div>
                <span className="settings-row-actions">
                  <button type="button" className="icon-button" onClick={() => setEditingId(entry.id)} aria-label="Edit transaction" data-testid={`transaction-edit-button-${entry.id}`}>
                    <PencilIcon width={16} height={16} />
                  </button>
                  <button type="button" className="icon-button" onClick={() => deleteExpense(entry.id)} aria-label="Delete transaction" data-testid={`transaction-delete-button-${entry.id}`}>
                    <TrashIcon width={16} height={16} />
                  </button>
                </span>
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  );
}
