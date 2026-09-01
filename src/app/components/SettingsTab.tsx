import { useState } from 'react';
import { useAppState } from '../state/AppProvider';
import { toISODate } from '../../core/dateUtils';
import { PencilIcon, TrashIcon } from './icons';

function SetupSection() {
  const { planView, saveSetup, fixedExpenses } = useAppState();
  const config = planView.config!;
  const [income, setIncome] = useState(String(config.monthlyIncome));
  const [cycleDay, setCycleDay] = useState(String(config.cycleStartDay));
  const [currency, setCurrency] = useState(config.currency);
  const [saved, setSaved] = useState(false);

  const incomeNum = Number(income);
  const cycleDayNum = Number(cycleDay);
  const isValid = income !== '' && incomeNum >= 0 && cycleDayNum >= 1 && cycleDayNum <= 28 && currency.trim().length > 0;

  function save() {
    if (!isValid) return;
    saveSetup({ monthlyIncome: incomeNum, cycleStartDay: cycleDayNum, currency: currency.trim() }, fixedExpenses);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="settings-section" data-testid="settings-setup-section">
      <h2>Setup</h2>
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
      <button type="button" disabled={!isValid} onClick={save} data-testid="settings-save-setup-button">
        {saved ? 'Saved' : 'Save'}
      </button>
    </section>
  );
}

function GoalSection() {
  const { planView, saveGoal } = useAppState();
  const goal = planView.goal;
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.targetAmount) : '');
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '');
  const [saved, setSaved] = useState(false);

  const amountNum = Number(targetAmount);
  const isValid = targetAmount !== '' && amountNum > 0 && targetDate !== '';

  function save() {
    if (!isValid) return;
    saveGoal({ targetAmount: amountNum, targetDate, startDate: goal?.startDate ?? toISODate(new Date()) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="settings-section" data-testid="settings-goal-section">
      <h2>Savings Goal</h2>
      <p>Any target, any timeframe - e.g. 500,000 in 6 months.</p>
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
        <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} data-testid="settings-goal-date-input" />
      </label>
      <button type="button" disabled={!isValid} onClick={save} data-testid="settings-save-goal-button">
        {saved ? 'Saved' : 'Save Goal'}
      </button>
    </section>
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
    <section className="settings-section" data-testid="settings-categories-section">
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

export function SettingsTab() {
  const { planView } = useAppState();
  if (!planView.config) return null;
  return (
    <div className="tab-panel">
      <SetupSection />
      <GoalSection />
      <CategoriesSection />
    </div>
  );
}
