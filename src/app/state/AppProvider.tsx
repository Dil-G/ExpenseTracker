import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LocalStorageAdapter } from '../../core/storage/localStorageAdapter';
import type { AdviceResponse, CategoryId, ExpenseEntry, FixedExpenseItem, PlanConfig } from '../../core/types';
import { buildPlanView, saveSetup as saveSetupService, type PlanView } from '../services/planService';
import { addExpense as addExpenseService, buildAllowanceBreakdown, buildProgress, type AddExpenseInput } from '../services/trackingService';
import { buildAdviceRequestPayload, shouldAutoFetchWeekly } from '../services/adviceService';
import { fetchAdvice } from '../services/adviceClient';

export type TabId = 'today' | 'progress' | 'advice';
export type AdviceUIStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AdviceUIState {
  status: AdviceUIStatus;
  data: AdviceResponse | null;
  errorMessage: string | null;
  lastFetchKind: 'manual' | 'weekly' | null;
}

interface AppContextValue {
  planView: PlanView;
  fixedExpenses: FixedExpenseItem[];
  entries: ExpenseEntry[];
  allowanceBreakdown: ReturnType<typeof buildAllowanceBreakdown> | null;
  progress: ReturnType<typeof buildProgress> | null;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isSetupWizardOpen: boolean;
  openSetupWizard: () => void;
  closeSetupWizard: () => void;
  saveSetup: (config: PlanConfig, fixedExpenses: FixedExpenseItem[]) => void;
  lastUsedCategory: CategoryId;
  addExpense: (input: AddExpenseInput) => void;
  advice: AdviceUIState;
  requestAdvice: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [storage] = useState(() => new LocalStorageAdapter());
  const [config, setConfig] = useState<PlanConfig | null>(null);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseItem[]>([]);
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [lastUsedCategory, setLastUsedCategory] = useState<CategoryId>('food');
  const [advice, setAdvice] = useState<AdviceUIState>({ status: 'idle', data: null, errorMessage: null, lastFetchKind: null });

  useEffect(() => {
    const loadedConfig = storage.getPlanConfig();
    setConfig(loadedConfig);
    setFixedExpenses(storage.getFixedExpenses());
    setEntries(storage.getExpenseEntries());
    if (loadedConfig === null) setIsSetupWizardOpen(true);
  }, [storage]);

  const today = useMemo(() => new Date(), []);

  const planView = useMemo(() => buildPlanView(config, fixedExpenses, today), [config, fixedExpenses, today]);

  const allowanceBreakdown = useMemo(() => {
    if (!planView.config || !planView.feasibility || !planView.cycleWindow) return null;
    return buildAllowanceBreakdown(planView.feasibility, planView.config, entries, planView.cycleWindow, today);
  }, [planView, entries, today]);

  const progress = useMemo(() => {
    if (!planView.config || !planView.feasibility || !planView.cycleWindow) return null;
    return buildProgress(planView.feasibility, planView.config, entries, planView.cycleWindow, today);
  }, [planView, entries, today]);

  const saveSetup = useCallback(
    (newConfig: PlanConfig, newFixedExpenses: FixedExpenseItem[]) => {
      saveSetupService(storage, newConfig, newFixedExpenses);
      setConfig(newConfig);
      setFixedExpenses(newFixedExpenses);
      setIsSetupWizardOpen(false);
    },
    [storage],
  );

  const addExpense = useCallback(
    (input: AddExpenseInput) => {
      const entry = addExpenseService(storage, input);
      setEntries((prev) => [...prev, entry]);
      setLastUsedCategory(entry.category);
    },
    [storage],
  );

  const requestAdvice = useCallback(
    (kind: 'manual' | 'weekly' = 'manual') => {
      if (!planView.config || !planView.feasibility || !allowanceBreakdown || !progress) return;
      setAdvice({ status: 'loading', data: null, errorMessage: null, lastFetchKind: kind });

      const fixedExpensesTotal = fixedExpenses.reduce((total, item) => total + item.amount, 0);
      const payload = buildAdviceRequestPayload(planView.config, fixedExpensesTotal, planView.feasibility, allowanceBreakdown, progress);

      fetchAdvice(payload)
        .then((data) => {
          setAdvice({ status: 'success', data, errorMessage: null, lastFetchKind: kind });
          storage.setLastAdviceFetchAt(new Date().toISOString());
        })
        .catch((error: unknown) => {
          setAdvice({
            status: 'error',
            data: null,
            errorMessage: error instanceof Error ? error.message : 'Advice is temporarily unavailable.',
            lastFetchKind: kind,
          });
          // deliberately not updating lastAdviceFetchAt on failure, so a failed weekly
          // check retries next app load rather than waiting another 7 days
        });
    },
    [planView, allowanceBreakdown, progress, fixedExpenses, storage],
  );

  useEffect(() => {
    if (!config) return;
    if (shouldAutoFetchWeekly(storage.getLastAdviceFetchAt(), new Date())) {
      requestAdvice('weekly');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const value: AppContextValue = {
    planView,
    fixedExpenses,
    entries,
    allowanceBreakdown,
    progress,
    activeTab,
    setActiveTab,
    isSetupWizardOpen,
    openSetupWizard: () => setIsSetupWizardOpen(true),
    closeSetupWizard: () => setIsSetupWizardOpen(false),
    saveSetup,
    lastUsedCategory,
    addExpense,
    advice,
    requestAdvice: () => requestAdvice('manual'),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within an AppProvider');
  return ctx;
}
