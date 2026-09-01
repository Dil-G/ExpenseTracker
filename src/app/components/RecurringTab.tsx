import { useState } from 'react';
import { useAppState } from '../state/AppProvider';
import { formatMoney } from '../utils/formatMoney';
import { EditModal } from './EditModal';
import { PencilIcon, TrashIcon } from './icons';
import type { RecurringPayment } from '../../core/types';

interface PaymentDraft {
  name: string;
  amount: string;
  dueDay: string;
  categoryId: string;
}

function draftFrom(payment: RecurringPayment | null, defaultCategoryId: string): PaymentDraft {
  if (!payment) return { name: '', amount: '', dueDay: '1', categoryId: defaultCategoryId };
  return { name: payment.name, amount: String(payment.amount), dueDay: String(payment.dueDay), categoryId: payment.categoryId };
}

function PaymentForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: PaymentDraft;
  submitLabel: string;
  onSubmit: (draft: { name: string; amount: number; dueDay: number; categoryId: string }) => void;
  onCancel: () => void;
}) {
  const { categories } = useAppState();
  const [name, setName] = useState(initial.name);
  const [amount, setAmount] = useState(initial.amount);
  const [dueDay, setDueDay] = useState(initial.dueDay);
  const [categoryId, setCategoryId] = useState(initial.categoryId);

  const amountNum = Number(amount);
  const dueDayNum = Number(dueDay);
  const isValid = name.trim().length > 0 && amountNum > 0 && dueDayNum >= 1 && dueDayNum <= 28 && categoryId !== '';

  function submit() {
    if (!isValid) return;
    onSubmit({ name: name.trim(), amount: amountNum, dueDay: dueDayNum, categoryId });
  }

  return (
    <>
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
      <div className="wizard-actions">
        <button type="button" className="button-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" disabled={!isValid} onClick={submit} data-testid="recurring-form-submit-button">
          {submitLabel}
        </button>
      </div>
    </>
  );
}

export function RecurringTab() {
  const { categories, recurringPayments, addRecurringPayment, updateRecurringPayment, deleteRecurringPayment } = useAppState();
  const [isAdding, setIsAdding] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null);

  function categoryName(id: string): string {
    return categories.find((c) => c.id === id)?.name ?? id;
  }

  return (
    <div className="tab-panel">
      <section className="card-section" data-testid="recurring-list">
        <div className="card-header">
          <div>
            <h2>Recurring Payments</h2>
            <p className="card-header-subtitle">Auto-logged as a transaction each cycle once its due day passes.</p>
          </div>
          <button
            type="button"
            disabled={categories.length === 0}
            onClick={() => setIsAdding(true)}
            data-testid="recurring-open-add-button"
          >
            Add
          </button>
        </div>

        {recurringPayments.length === 0 ? (
          <p>None yet.</p>
        ) : (
          <table className="recurring-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Due day</th>
                <th>Category</th>
                <th className="recurring-table-actions-header">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {recurringPayments.map((p) => (
                <tr key={p.id} data-testid={`recurring-row-${p.id}`}>
                  <td data-label="Name">{p.name}</td>
                  <td data-label="Amount" className="num">
                    {formatMoney(p.amount)}
                  </td>
                  <td data-label="Due day" className="num">
                    {p.dueDay}
                  </td>
                  <td data-label="Category">
                    <span className="category-pill">{categoryName(p.categoryId)}</span>
                  </td>
                  <td className="recurring-table-actions">
                    <button type="button" className="icon-button" onClick={() => setEditingPayment(p)} aria-label={`Edit ${p.name}`}>
                      <PencilIcon width={16} height={16} />
                    </button>
                    <button type="button" className="icon-button" onClick={() => deleteRecurringPayment(p.id)} aria-label={`Delete ${p.name}`}>
                      <TrashIcon width={16} height={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {isAdding && (
        <EditModal title="Add Recurring Payment" onClose={() => setIsAdding(false)}>
          <PaymentForm
            initial={draftFrom(null, categories[0]?.id ?? '')}
            submitLabel="Add"
            onCancel={() => setIsAdding(false)}
            onSubmit={(draft) => {
              addRecurringPayment(draft);
              setIsAdding(false);
            }}
          />
        </EditModal>
      )}

      {editingPayment && (
        <EditModal title="Edit Recurring Payment" onClose={() => setEditingPayment(null)}>
          <PaymentForm
            initial={draftFrom(editingPayment, categories[0]?.id ?? '')}
            submitLabel="Save"
            onCancel={() => setEditingPayment(null)}
            onSubmit={(draft) => {
              updateRecurringPayment(editingPayment.id, draft);
              setEditingPayment(null);
            }}
          />
        </EditModal>
      )}
    </div>
  );
}
