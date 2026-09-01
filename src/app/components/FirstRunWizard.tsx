import { useState } from 'react';
import type { FixedExpenseItem, PlanConfig } from '../../core/types';
import { useAppState } from '../state/AppProvider';
import { formatMoney } from '../utils/formatMoney';
import { CloseIcon } from './icons';

interface Draft {
  monthlyIncome: string;
  cycleStartDay: string;
  currency: string;
  fixedExpenses: FixedExpenseItem[];
}

const EMPTY_DRAFT: Draft = { monthlyIncome: '', cycleStartDay: '1', currency: '', fixedExpenses: [] };

/** First-run only (CR2): no gear-icon reopen anymore, editing lives in Settings.
 * No category weights step (removed, CR2 Q2) and no goal step - goals are optional
 * and set later from Settings whenever the user is ready. */
export function FirstRunWizard() {
  const { planView, saveSetup } = useAppState();
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  if (planView.config) return null;

  const income = Number(draft.monthlyIncome);
  const cycleDay = Number(draft.cycleStartDay);
  const step1Valid = draft.monthlyIncome !== '' && income >= 0 && cycleDay >= 1 && cycleDay <= 28 && draft.currency.trim().length > 0;

  function addFixedExpense() {
    const amount = Number(newExpenseAmount);
    if (newExpenseName.trim().length === 0 || !(amount >= 0)) return;
    setDraft((d) => ({
      ...d,
      fixedExpenses: [...d.fixedExpenses, { id: crypto.randomUUID(), name: newExpenseName.trim(), amount }],
    }));
    setNewExpenseName('');
    setNewExpenseAmount('');
  }

  function removeFixedExpense(id: string) {
    setDraft((d) => ({ ...d, fixedExpenses: d.fixedExpenses.filter((f) => f.id !== id) }));
  }

  function finish() {
    const config: PlanConfig = { monthlyIncome: income, cycleStartDay: cycleDay, currency: draft.currency.trim() };
    saveSetup(config, draft.fixedExpenses);
  }

  return (
    <div className="wizard-overlay">
      <div className="wizard-card">
        <div className="wizard-steps" aria-hidden="true">
          {[1, 2].map((s) => (
            <span key={s} className={s === step ? 'wizard-step-dot active' : s < step ? 'wizard-step-dot done' : 'wizard-step-dot'} />
          ))}
        </div>

        {step === 1 && (
          <section>
            <h2>Income &amp; Cycle</h2>
            <label>
              Monthly net income
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={draft.monthlyIncome}
                onChange={(e) => setDraft((d) => ({ ...d, monthlyIncome: e.target.value }))}
                data-testid="first-run-income-input"
              />
            </label>
            <label>
              Cycle start day (1-28)
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={28}
                value={draft.cycleStartDay}
                onChange={(e) => setDraft((d) => ({ ...d, cycleStartDay: e.target.value }))}
                data-testid="first-run-cycle-day-input"
              />
            </label>
            <label>
              Currency
              <input
                type="text"
                placeholder="e.g. USD, LKR"
                value={draft.currency}
                onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}
                data-testid="first-run-currency-input"
              />
            </label>
            <button type="button" disabled={!step1Valid} onClick={() => setStep(2)} data-testid="first-run-step1-next-button">
              Next
            </button>
          </section>
        )}

        {step === 2 && (
          <section>
            <h2>Fixed Expenses</h2>
            <p>Rent, insurance, subscriptions - anything that recurs at a fixed amount. Optional.</p>
            <ul className="fixed-expense-list">
              {draft.fixedExpenses.map((f) => (
                <li key={f.id}>
                  <span>
                    {f.name}: <span className="num">{formatMoney(f.amount)}</span>
                  </span>
                  <button type="button" className="button-secondary" onClick={() => removeFixedExpense(f.id)} aria-label={`Remove ${f.name}`}>
                    <CloseIcon width={14} height={14} />
                  </button>
                </li>
              ))}
            </ul>
            <input
              type="text"
              placeholder="Name (e.g. Rent)"
              value={newExpenseName}
              onChange={(e) => setNewExpenseName(e.target.value)}
              data-testid="first-run-expense-name-input"
            />
            <input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="Amount"
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
              data-testid="first-run-expense-amount-input"
            />
            <button type="button" onClick={addFixedExpense} data-testid="first-run-add-expense-button">
              Add
            </button>
            <div className="wizard-actions">
              <button type="button" className="button-secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" onClick={finish} data-testid="first-run-finish-button">
                Finish Setup
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
