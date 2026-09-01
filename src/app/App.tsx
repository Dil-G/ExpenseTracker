import { useState } from 'react';
import { AppProvider, useAppState } from './state/AppProvider';
import { SetupWizard } from './components/SetupWizard';
import { TabBar } from './components/TabBar';
import { TodaySummary } from './components/TodaySummary';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { InfeasibilityBanner } from './components/InfeasibilityBanner';
import { AddExpenseButton } from './components/AddExpenseButton';
import { AddExpenseSheet } from './components/AddExpenseSheet';
import { ProgressPanel } from './components/ProgressPanel';
import { AdvicePanel } from './components/AdvicePanel';
import { GearIcon } from './components/icons';

function TodayTab() {
  const { planView, allowanceBreakdown, lastUsedCategory, addExpense } = useAppState();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (!planView.feasibility || !allowanceBreakdown) return null;

  return (
    <div className="tab-panel">
      <InfeasibilityBanner feasibility={planView.feasibility} />
      <TodaySummary allowances={allowanceBreakdown} />
      <CategoryBreakdown allowances={allowanceBreakdown} />
      <AddExpenseButton onClick={() => setIsSheetOpen(true)} />
      <AddExpenseSheet
        isOpen={isSheetOpen}
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

function ProgressTab() {
  const { progress, planView, allowanceBreakdown } = useAppState();
  if (!progress || !planView.cycleWindow || !planView.config || !allowanceBreakdown) return null;
  return (
    <div className="tab-panel">
      <ProgressPanel
        progress={progress}
        cycleWindow={planView.cycleWindow}
        allowances={allowanceBreakdown}
        savingsGoal={planView.config.savingsGoal}
      />
    </div>
  );
}

function AdviceTab() {
  return (
    <div className="tab-panel">
      <AdvicePanel />
    </div>
  );
}

function TabbedShell() {
  const { activeTab, openSetupWizard } = useAppState();
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Rollover</h1>
        <button type="button" className="icon-button" onClick={openSetupWizard} aria-label="Edit setup" data-testid="settings-button">
          <GearIcon />
        </button>
      </header>
      {activeTab === 'today' && <TodayTab />}
      {activeTab === 'progress' && <ProgressTab />}
      {activeTab === 'advice' && <AdviceTab />}
      <TabBar />
    </div>
  );
}

function AppInner() {
  const { planView } = useAppState();
  return (
    <>
      {planView.config ? <TabbedShell /> : null}
      <SetupWizard />
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
