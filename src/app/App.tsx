import { useState } from 'react';
import { AppProvider, useAppState } from './state/AppProvider';
import { FirstRunWizard } from './components/FirstRunWizard';
import { TabBar } from './components/TabBar';
import { TodaySummary } from './components/TodaySummary';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { InfeasibilityBanner } from './components/InfeasibilityBanner';
import { AddExpenseButton } from './components/AddExpenseButton';
import { AddExpenseSheet } from './components/AddExpenseSheet';
import { ProgressPanel } from './components/ProgressPanel';
import { AdvicePanel } from './components/AdvicePanel';
import { TransactionsTab } from './components/TransactionsTab';
import { RecurringTab } from './components/RecurringTab';
import { SettingsTab } from './components/SettingsTab';
import { formatMoney } from './utils/formatMoney';

function OverviewTab() {
  const { planView, categories, categorySpend, todaySpend, progress, overviewMode, setOverviewMode, lastUsedCategory, addExpense } = useAppState();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (!planView.feasibility || !planView.config) return null;

  return (
    <div className="tab-panel">
      <InfeasibilityBanner feasibility={planView.feasibility} />

      <div className="overview-toggle" role="tablist" aria-label="Overview period">
        <button
          type="button"
          className={overviewMode === 'daily' ? 'overview-toggle-button active' : 'overview-toggle-button'}
          onClick={() => setOverviewMode('daily')}
          data-testid="overview-mode-daily-button"
        >
          Daily
        </button>
        <button
          type="button"
          className={overviewMode === 'monthly' ? 'overview-toggle-button active' : 'overview-toggle-button'}
          onClick={() => setOverviewMode('monthly')}
          data-testid="overview-mode-monthly-button"
        >
          Monthly
        </button>
      </div>

      {overviewMode === 'daily' && <TodaySummary todaySpend={todaySpend} />}

      {overviewMode === 'monthly' && (
        <>
          <section className="today-summary" data-testid="monthly-budget-summary">
            <h2>This Cycle</h2>
            <p>
              Spent: <strong className="num">{formatMoney(Object.values(categorySpend).reduce((s, v) => s + v, 0))}</strong> / budget:{' '}
              <strong className="num">{formatMoney(planView.feasibility.discretionaryBudget)}</strong>
            </p>
          </section>
          <CategoryBreakdown categories={categories} categorySpend={categorySpend} totalIncome={planView.config.monthlyIncome} />
          {progress && planView.cycleWindow && <ProgressPanel progress={progress} cycleWindow={planView.cycleWindow} goal={planView.goal} />}
        </>
      )}

      <AdvicePanel />

      <AddExpenseButton onClick={() => setIsSheetOpen(true)} />
      <AddExpenseSheet
        isOpen={isSheetOpen}
        categories={categories}
        defaultCategory={lastUsedCategory}
        onSave={(input) => {
          addExpense(input);
          setIsSheetOpen(false);
        }}
        onClose={() => setIsSheetOpen(false)}
      />
    </div>
  );
}

function TabbedShell() {
  const { activeTab } = useAppState();
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Rollover</h1>
      </header>
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'transactions' && <TransactionsTab />}
      {activeTab === 'recurring' && <RecurringTab />}
      {activeTab === 'settings' && <SettingsTab />}
      <TabBar />
    </div>
  );
}

function AppInner() {
  const { planView } = useAppState();
  return (
    <>
      {planView.config ? <TabbedShell /> : null}
      <FirstRunWizard />
    </>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
