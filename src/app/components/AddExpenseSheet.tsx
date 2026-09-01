import { useState } from 'react';
import type { Category, CategoryId } from '../../core/types';
import type { AddExpenseInput } from '../services/trackingService';
import { DateInput } from './DateInput';

interface Props {
  isOpen: boolean;
  categories: Category[];
  defaultCategory: CategoryId;
  onSave: (input: AddExpenseInput) => void;
  onClose: () => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddExpenseSheet({ isOpen, categories, defaultCategory, onSave, onClose }: Props) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryId>(defaultCategory);
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const amountValue = Number(amount);
  const isValid = amount !== '' && amountValue > 0 && category !== '';

  function handleSave() {
    if (!isValid) return;
    onSave({ amount: amountValue, category, date, note: note.trim() || undefined });
    setAmount('');
    setCategory(defaultCategory);
    setDate(todayIso());
    setNote('');
  }

  return (
    <div className="sheet-overlay">
      <div className="sheet" data-testid="add-expense-sheet">
        <div className="sheet-handle" aria-hidden="true" />
        <h2>Add Expense</h2>
        <label>
          Amount
          <input
            type="number"
            inputMode="decimal"
            min={0}
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            data-testid="add-expense-amount-input"
          />
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)} data-testid="add-expense-category-select">
            {categories.length === 0 && <option value="">No categories yet</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date
          <DateInput value={date} onChange={(e) => setDate(e.target.value)} data-testid="add-expense-date-input" />
        </label>
        <label>
          Note (optional)
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} data-testid="add-expense-note-input" />
        </label>
        <div className="sheet-actions">
          <button type="button" className="button-secondary" onClick={onClose} data-testid="add-expense-cancel-button">
            Cancel
          </button>
          <button type="button" disabled={!isValid} onClick={handleSave} data-testid="add-expense-save-button">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
