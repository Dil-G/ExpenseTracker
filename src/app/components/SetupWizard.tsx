import { useState } from 'react';
import { CATEGORY_IDS, type CategoryWeights, type FixedExpenseItem, type PlanConfig } from '../../core/types';
import { weightsSumTo100 } from '../services/planService';
import { useAppState } from '../state/AppProvider';

interface Draft {
  monthlyIncome: string;
  savingsGoal: string;
  cycleStartDay: string;
  currency: string;
  fixedExpenses: FixedExpenseItem[];
  categoryWeights: CategoryWeights;
}

function defaultDraft(config: PlanConfig | null, fixedExpenses: FixedExpenseItem[]): Draft {
  if (config) {
    return {
      monthlyIncome: String(config.monthlyIncome),
      savingsGoal: String(config.savingsGoal),
      cycleStartDay: String(config.cycleStartDay),
      currency: config.currency,
      fixedExpenses,
      categoryWeights: config.categoryWeights,
    };
  }
  return {
    monthlyIncome: '',
    savingsGoal: '',
    cycleStartDay: '1',
    currency: '',
    fixedExpenses: [],
    categoryWeights: { food: 25, transport: 25, entertainment: 25, other: 25 },
  };
}

export function SetupWizard() {
  const { planView, fixedExpenses, saveSetup, closeSetupWizard, isSetupWizardOpen } = useAppState();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<Draft>(() => defaultDraft(planView.config, fixedExpenses));
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  if (!isSetupWizardOpen) return null;

  const income = Number(draft.monthlyIncome);
  const goal = Number(draft.savingsGoal);
  const cycleDay = Number(draft.cycleStartDay);
  const step1Valid = draft.monthlyIncome !== '' && income >= 0 && draft.savingsGoal !== '' && goal >= 0 && cycleDay >= 1 && cycleDay <= 28 && draft.currency.trim().length > 0;

  const weightSum = CATEGORY_IDS.reduce((total, category) => total + draft.categoryWeights[category], 0);
  const step3Valid = weightsSumTo100(draft.categoryWeights);

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
    const config: PlanConfig = {
      monthlyIncome: income,
      savingsGoal: goal,
      cycleStartDay: cycleDay,
      currency: draft.currency.trim(),
      categoryWeights: draft.categoryWeights,
    };
    saveSetup(config, draft.fixedExpenses);
    setStep(1);
  }

  return (
    <div className="wizard-overlay">
      <div className="wizard-card">
        {planView.config && (
          <button type="button" className="wizard-close" onClick={closeSetupWizard} data-testid="setup-wizard-close-button">
            ✕
          </button>
        )}

        {step === 1 && (
          <section>
            <h2>Income &amp; Goal</h2>
            <label>
              Monthly net income
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={draft.monthlyIncome}
                onChange={(e) => setDraft((d) => ({ ...d, monthlyIncome: e.target.value }))}
                data-testid="setup-wizard-step1-income-input"
              />
            </label>
            <label>
              Monthly savings goal
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={draft.savingsGoal}
                onChange={(e) => setDraft((d) => ({ ...d, savingsGoal: e.target.value }))}
                data-testid="setup-wizard-step1-goal-input"
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
                data-testid="setup-wizard-step1-cycle-day-input"
              />
            </label>
            <label>
              Currency
              <input
                type="text"
                placeholder="e.g. USD, LKR"
                value={draft.currency}
                onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}
                data-testid="setup-wizard-step1-currency-input"
              />
            </label>
            <button type="button" disabled={!step1Valid} onClick={() => setStep(2)} data-testid="setup-wizard-step1-next-button">
              Next
            </button>
          </section>
        )}

        {step === 2 && (
          <section>
            <h2>Fixed Expenses</h2>
            <ul>
              {draft.fixedExpenses.map((f) => (
                <li key={f.id}>
                  {f.name}: {f.amount}
                  <button type="button" onClick={() => removeFixedExpense(f.id)} aria-label={`Remove ${f.name}`}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <input
              type="text"
              placeholder="Name (e.g. Rent)"
              value={newExpenseName}
              onChange={(e) => setNewExpenseName(e.target.value)}
              data-testid="setup-wizard-step2-expense-name-input"
            />
            <input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="Amount"
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
              data-testid="setup-wizard-step2-expense-amount-input"
            />
            <button type="button" onClick={addFixedExpense} data-testid="setup-wizard-step2-add-expense-button">
              Add
            </button>
            <div className="wizard-actions">
              <button type="button" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" onClick={() => setStep(3)} data-testid="setup-wizard-step2-next-button">
                Next
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h2>Category Weights</h2>
            <p>Split your discretionary budget across categories. Must add up to 100%.</p>
            {CATEGORY_IDS.map((category) => (
              <label key={category}>
                {category}
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  value={draft.categoryWeights[category]}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      categoryWeights: { ...d.categoryWeights, [category]: Number(e.target.value) },
                    }))
                  }
                  data-testid={`setup-wizard-step3-weight-${category}-input`}
                />
              </label>
            ))}
            <p data-testid="setup-wizard-step3-weight-sum">Current total: {weightSum}%</p>
            <div className="wizard-actions">
              <button type="button" onClick={() => setStep(2)}>
                Back
              </button>
              <button type="button" disabled={!step3Valid} onClick={finish} data-testid="setup-wizard-step3-finish-button">
                Finish Setup
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
