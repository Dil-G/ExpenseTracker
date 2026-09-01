import { useState } from 'react';
import { useAppState } from '../state/AppProvider';
import { toISODate } from '../../core/dateUtils';
import { formatMoney } from '../utils/formatMoney';
import { PencilIcon, TrashIcon } from './icons';
import { DateInput } from './DateInput';
import { EditModal } from './EditModal';
import { generateAugustDemoEntries, generateDemoRecurringPayments, generateSeptemberFirstDemoEntries } from '../utils/demoData';

function SetupSection() {
  const { planView, saveSetup, fixedExpenses } = useAppState();
  const config = planView.config!;
  const [isEditing, setIsEditing] = useState(false);
  const [income, setIncome] = useState(String(config.monthlyIncome));
  const [cycleDay, setCycleDay] = useState(String(config.cycleStartDay));
  const [currency, setCurrency] = useState(config.currency);

  const incomeNum = Number(income);
  const cycleDayNum = Number(cycleDay);
  const isValid = income !== '' && incomeNum >= 0 && cycleDayNum >= 1 && cycleDayNum <= 28 && currency.trim().length > 0;

  function openEdit() {
    setIncome(String(config.monthlyIncome));
    setCycleDay(String(config.cycleStartDay));
    setCurrency(config.currency);
    setIsEditing(true);
  }

  function save() {
    if (!isValid) return;
    saveSetup({ monthlyIncome: incomeNum, cycleStartDay: cycleDayNum, currency: currency.trim() }, fixedExpenses);
    setIsEditing(false);
  }

  return (
    <>
      <section className="card-section" data-testid="settings-setup-section">
        <div className="card-header">
          <h2>Setup</h2>
          <button type="button" className="icon-button" onClick={openEdit} aria-label="Edit setup" data-testid="settings-edit-setup-button">
            <PencilIcon width={16} height={16} />
          </button>
        </div>
        <dl className="readonly-list">
          <div className="readonly-row">
            <dt>Monthly net income</dt>
            <dd className="num">{formatMoney(config.monthlyIncome)}</dd>
          </div>
          <div className="readonly-row">
            <dt>Cycle start day</dt>
            <dd className="num">{config.cycleStartDay}</dd>
          </div>
          <div className="readonly-row">
            <dt>Currency</dt>
            <dd>{config.currency}</dd>
          </div>
        </dl>
      </section>

      {isEditing && (
        <EditModal title="Edit Setup" onClose={() => setIsEditing(false)}>
          <label>
            Monthly net income
            <input type="number" inputMode="decimal" min={0} value={income} onChange={(e) => setIncome(e.target.value)} data-testid="settings-income-input" />
          </label>
          <label>
            Cycle start day (1-28)
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={28}
              value={cycleDay}
              onChange={(e) => setCycleDay(e.target.value)}
              data-testid="settings-cycle-day-input"
            />
          </label>
          <label>
            Currency
            <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} data-testid="settings-currency-input" />
          </label>
          <div className="wizard-actions">
            <button type="button" className="button-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button type="button" disabled={!isValid} onClick={save} data-testid="settings-save-setup-button">
              Save
            </button>
          </div>
        </EditModal>
      )}
    </>
  );
}

function GoalSection() {
  const { planView, saveGoal } = useAppState();
  const goal = planView.goal;
  const [isEditing, setIsEditing] = useState(false);
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.targetAmount) : '');
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '');

  const amountNum = Number(targetAmount);
  const isValid = targetAmount !== '' && amountNum > 0 && targetDate !== '';

  function openEdit() {
    setTargetAmount(goal ? String(goal.targetAmount) : '');
    setTargetDate(goal?.targetDate ?? '');
    setIsEditing(true);
  }

  function save() {
    if (!isValid) return;
    saveGoal({ targetAmount: amountNum, targetDate, startDate: goal?.startDate ?? toISODate(new Date()) });
    setIsEditing(false);
  }

  return (
    <>
      <section className="card-section" data-testid="settings-goal-section">
        <div className="card-header">
          <h2>Savings Goal</h2>
          <button type="button" className="icon-button" onClick={openEdit} aria-label="Edit goal" data-testid="settings-edit-goal-button">
            <PencilIcon width={16} height={16} />
          </button>
        </div>
        {goal ? (
          <dl className="readonly-list">
            <div className="readonly-row">
              <dt>Target amount</dt>
              <dd className="num">{formatMoney(goal.targetAmount)}</dd>
            </div>
            <div className="readonly-row">
              <dt>Target date</dt>
              <dd>{goal.targetDate}</dd>
            </div>
          </dl>
        ) : (
          <p>No goal set - any target, any timeframe, e.g. 500,000 in 6 months.</p>
        )}
      </section>

      {isEditing && (
        <EditModal title="Edit Savings Goal" onClose={() => setIsEditing(false)}>
          <label>
            Target amount
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              data-testid="settings-goal-amount-input"
            />
          </label>
          <label>
            Target date
            <DateInput value={targetDate} onChange={(e) => setTargetDate(e.target.value)} data-testid="settings-goal-date-input" />
          </label>
          <div className="wizard-actions">
            <button type="button" className="button-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button type="button" disabled={!isValid} onClick={save} data-testid="settings-save-goal-button">
              Save
            </button>
          </div>
        </EditModal>
      )}
    </>
  );
}

function CategoriesSection() {
  const { categories, addCategory, renameCategory, deleteCategory } = useAppState();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  function add() {
    if (newName.trim().length === 0) return;
    addCategory(newName.trim());
    setNewName('');
  }

  function startEdit(id: string, name: string) {
    setEditingId(id);
    setEditingName(name);
  }

  function saveEdit() {
    if (editingId && editingName.trim().length > 0) {
      renameCategory(editingId, editingName.trim());
    }
    setEditingId(null);
  }

  function remove(id: string, name: string) {
    const ok = deleteCategory(id);
    if (!ok) {
      setBlockedMessage(`Can't delete "${name}" - it still has transactions. Reassign or delete those first.`);
      setTimeout(() => setBlockedMessage(null), 4000);
    }
  }

  return (
    <section className="card-section" data-testid="settings-categories-section">
      <h2>Categories</h2>
      {blockedMessage && (
        <p role="alert" className="advice-tone-warning" data-testid="settings-category-blocked-message">
          {blockedMessage}
        </p>
      )}
      <ul className="fixed-expense-list">
        {categories.map((c) => (
          <li key={c.id}>
            {editingId === c.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                autoFocus
                data-testid={`settings-category-edit-input-${c.id}`}
              />
            ) : (
              <span>{c.name}</span>
            )}
            <span className="settings-row-actions">
              <button type="button" className="icon-button" onClick={() => startEdit(c.id, c.name)} aria-label={`Rename ${c.name}`}>
                <PencilIcon width={16} height={16} />
              </button>
              <button type="button" className="icon-button" onClick={() => remove(c.id, c.name)} aria-label={`Delete ${c.name}`}>
                <TrashIcon width={16} height={16} />
              </button>
            </span>
          </li>
        ))}
      </ul>
      <input
        type="text"
        placeholder="New category name"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        data-testid="settings-new-category-input"
      />
      <button type="button" onClick={add} data-testid="settings-add-category-button">
        Add Category
      </button>
    </section>
  );
}

function DemoDataSection() {
  const { categories, addExpense, addRecurringPayment } = useAppState();
  const [status, setStatus] = useState<'idle' | 'done'>('idle');

  function load() {
    generateAugustDemoEntries(categories).forEach((entry) => addExpense(entry));
    generateSeptemberFirstDemoEntries(categories).forEach((entry) => addExpense(entry));
    generateDemoRecurringPayments(categories).forEach((payment) => addRecurringPayment(payment));
    setStatus('done');
    setTimeout(() => setStatus('idle'), 3000);
  }

  return (
    <section className="card-section" data-testid="settings-demo-data-section">
      <h2>Demo Data</h2>
      <p>Fill August 2026 and today with sample transactions and recurring payments, to see Transactions, Overview and Recurring with real data.</p>
      <button type="button" onClick={load} data-testid="settings-load-demo-data-button">
        Load Demo Data
      </button>
      {status === 'done' && (
        <p role="status" className="advice-tone-encouragement">
          Demo data loaded.
        </p>
      )}
    </section>
  );
}

export function SettingsTab() {
  const { planView } = useAppState();
  if (!planView.config) return null;
  return (
    <div className="tab-panel settings-tab">
      <SetupSection />
      <GoalSection />
      <CategoriesSection />
      <DemoDataSection />
    </div>
  );
}
