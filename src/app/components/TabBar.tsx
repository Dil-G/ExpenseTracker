import { useAppState, type TabId } from '../state/AppProvider';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'recurring', label: 'Recurring' },
  { id: 'settings', label: 'Settings' },
];

export function TabBar() {
  const { activeTab, setActiveTab } = useAppState();
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? 'tab-bar-button active' : 'tab-bar-button'}
          onClick={() => setActiveTab(tab.id)}
          data-testid={`tab-bar-${tab.id}-button`}
          aria-pressed={activeTab === tab.id}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
