import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LocalStorageAdapter } from '../../core/storage/localStorageAdapter';
import type { AdviceResponse, Category, ExpenseEntry, FixedExpenseItem, Goal, PlanConfig, RecurringPayment, SavingsLedgerState } from '../../core/types';
import { buildPlanView, refreshSavingsLedger, saveGoal as saveGoalService, saveSetup as saveSetupService, type PlanView } from '../services/planService';
import {
  addExpense as addExpenseService,
  buildCategorySpend,
  buildProgress,
  buildTodaySpend,
  deleteExpense as deleteExpenseService,
  updateExpense as updateExpenseService,
  type AddExpenseInput,
} from '../services/trackingService';
import { addCategory as addCategoryService, deleteCategory as deleteCategoryService, renameCategory as renameCategoryService } from '../services/categoryService';
import {
  addRecurringPayment as addRecurringPaymentService,
  deleteRecurringPayment as deleteRecurringPaymentService,
  processRecurringPayments,
  updateRecurringPayment as updateRecurringPaymentService,
  type AddRecurringPaymentInput,
} from '../services/recurringService';
import { buildAdviceRequestPayload, shouldAutoFetchWeekly } from '../services/adviceService';
import { fetchAdvice } from '../services/adviceClient';

export type TabId = 'overview' | 'transactions' | 'recurring' | 'settings';
export type OverviewMode = 'daily' | 'monthly';
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
  categories: Category[];
  recurringPayments: RecurringPayment[];
  categorySpend: Record<string, number>;
  todaySpend: number;
  progress: ReturnType<typeof buildProgress> | null;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  overviewMode: OverviewMode;
  setOverviewMode: (mode: OverviewMode) => void;
  saveSetup: (config: PlanConfig, fixedExpenses: FixedExpenseItem[]) => void;
  saveGoal: (goal: Goal) => void;
  lastUsedCategory: string;
  addExpense: (input: AddExpenseInput) => void;
  updateExpense: (id: string, patch: Partial<ExpenseEntry>) => void;
  deleteExpense: (id: string) => void;
  addCategory: (name: string) => void;
  renameCategory: (id: string, newName: string) => void;
  deleteCategory: (id: string) => boolean;
  addRecurringPayment: (input: AddRecurringPaymentInput) => void;
  updateRecurringPayment: (id: string, patch: Partial<RecurringPayment>) => void;
  deleteRecurringPayment: (id: string) => void;
  advice: AdviceUIState;
  requestAdvice: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [storage] = useState(() => new LocalStorageAdapter());
  const [config, setConfig] = useState<PlanConfig | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseItem[]>([]);
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [ledger, setLedger] = useState<SavingsLedgerState>({ bankedTotal: 0, lastBankedCycleStart: null });
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [overviewMode, setOverviewMode] = useState<OverviewMode>('daily');
  const [lastUsedCategory, setLastUsedCategory] = useState<string>('');
  const [advice, setAdvice] = useState<AdviceUIState>({ status: 'idle', data: null, errorMessage: null, lastFetchKind: null });

  useEffect(() => {
    const loadedConfig = storage.getPlanConfig();
    const loadedGoal = storage.getGoal();
    const loadedFixedExpenses = storage.getFixedExpenses();
    let loadedEntries = storage.getExpenseEntries();
    const loadedCategories = storage.getCategories();
    let loadedRecurring = storage.getRecurringPayments();
    let loadedLedger = storage.getSavingsLedger();

    const today = new Date();

    if (loadedConfig) {
      const cycleWindow = buildPlanView(loadedConfig, loadedGoal, loadedFixedExpenses, loadedLedger, today).cycleWindow!;
      const newEntries = processRecurringPayments(storage, loadedRecurring, cycleWindow, today);
      if (newEntries.length > 0) {
        loadedEntries = [...loadedEntries, ...newEntries];
        loadedRecurring = storage.getRecurringPayments();
      }
      if (loadedGoal) {
        loadedLedger = refreshSavingsLedger(storage, loadedConfig, loadedGoal, loadedFixedExpenses, loadedEntries, today);
      }
    }

    setConfig(loadedConfig);
    setGoal(loadedGoal);
    setFixedExpenses(loadedFixedExpenses);
    setEntries(loadedEntries);
    setCategories(loadedCategories);
    setRecurringPayments(loadedRecurring);
    setLedger(loadedLedger);
    setLastUsedCategory(loadedCategories[0]?.id ?? '');
  }, [storage]);

  const today = useMemo(() => new Date(), []);

  const planView = useMemo(() => buildPlanView(config, goal, fixedExpenses, ledger, today), [config, goal, fixedExpenses, ledger, today]);

  const categorySpend = useMemo(() => {
    if (!planView.cycleWindow) return {};
    return buildCategorySpend(entries, planView.cycleWindow, today);
  }, [entries, planView.cycleWindow, today]);

  const todaySpend = useMemo(() => {
    if (!planView.cycleWindow) return 0;
    return buildTodaySpend(entries, planView.cycleWindow, today);
  }, [entries, planView.cycleWindow, today]);

  const progress = useMemo(() => {
    if (!planView.cycleWindow || !planView.feasibility) return null;
    return buildProgress(
      planView.feasibility.discretionaryBudget,
      planView.bankedTotal,
      goal?.targetAmount ?? 0,
      planView.requiredMonthlyPace,
      entries,
      planView.cycleWindow,
      today,
    );
  }, [planView, goal, entries, today]);

  const saveSetup = useCallback(
    (newConfig: PlanConfig, newFixedExpenses: FixedExpenseItem[]) => {
      saveSetupService(storage, newConfig, newFixedExpenses);
      setConfig(newConfig);
      setFixedExpenses(newFixedExpenses);
    },
    [storage],
  );

  const saveGoal = useCallback(
    (newGoal: Goal) => {
      saveGoalService(storage, newGoal);
      setGoal(newGoal);
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

  const updateExpense = useCallback(
    (id: string, patch: Partial<ExpenseEntry>) => {
      updateExpenseService(storage, id, patch);
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    },
    [storage],
  );

  const deleteExpense = useCallback(
    (id: string) => {
      deleteExpenseService(storage, id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [storage],
  );

  const addCategory = useCallback(
    (name: string) => {
      setCategories(addCategoryService(storage, categories, name));
    },
    [storage, categories],
  );

  const renameCategory = useCallback(
    (id: string, newName: string) => {
      setCategories(renameCategoryService(storage, categories, id, newName));
    },
    [storage, categories],
  );

  const deleteCategory = useCallback(
    (id: string): boolean => {
      const result = deleteCategoryService(storage, categories, entries, id);
      if (result === null) return false;
      setCategories(result);
      return true;
    },
    [storage, categories, entries],
  );

  const addRecurringPayment = useCallback(
    (input: AddRecurringPaymentInput) => {
      const payment = addRecurringPaymentService(storage, input);
      setRecurringPayments((prev) => [...prev, payment]);
    },
    [storage],
  );

  const updateRecurringPayment = useCallback(
    (id: string, patch: Partial<RecurringPayment>) => {
      updateRecurringPaymentService(storage, id, patch);
      setRecurringPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    [storage],
  );

  const deleteRecurringPayment = useCallback(
    (id: string) => {
      deleteRecurringPaymentService(storage, id);
      setRecurringPayments((prev) => prev.filter((p) => p.id !== id));
    },
    [storage],
  );

  const requestAdvice = useCallback(
    (kind: 'manual' | 'weekly' = 'manual') => {
      if (!planView.config || !planView.feasibility || !progress) return;
      setAdvice({ status: 'loading', data: null, errorMessage: null, lastFetchKind: kind });

      const fixedExpensesTotal = fixedExpenses.reduce((total, item) => total + item.amount, 0);
      const payload = buildAdviceRequestPayload(
        planView.config,
        fixedExpensesTotal,
        goal,
        planView.requiredMonthlyPace,
        planView.feasibility,
        categorySpend,
        progress,
      );

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
        });
    },
    [planView, progress, fixedExpenses, goal, categorySpend, storage],
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
    categories,
    recurringPayments,
    categorySpend,
    todaySpend,
    progress,
    activeTab,
    setActiveTab,
    overviewMode,
    setOverviewMode,
    saveSetup,
    saveGoal,
    lastUsedCategory,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    renameCategory,
    deleteCategory,
    addRecurringPayment,
    updateRecurringPayment,
    deleteRecurringPayment,
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
