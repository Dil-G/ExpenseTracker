# Frontend Components — Unit 2: Web App & Advice Proxy

## Component Hierarchy

```
App
└── AppProvider (context: config, fixedExpenses, entries, tab, advice state, actions)
    └── AppShell
        ├── (config === null) SetupWizard
        │     ├── WizardStep1IncomeGoal
        │     ├── WizardStep2FixedExpenses
        │     └── WizardStep3CategoryWeights
        └── (config !== null) TabbedShell
              ├── Header (app title + settings icon -> opens SetupWizard overlay)
              ├── TabBar (Today | Progress | Advice)
              ├── TodayTab
              │     ├── InfeasibilityBanner (conditional)
              │     ├── TodaySummary
              │     ├── CategoryBreakdown
              │     └── AddExpenseButton (fixed, bottom) -> opens AddExpenseSheet
              ├── ProgressTab
              │     └── ProgressPanel
              ├── AdviceTab
              │     └── AdvicePanel
              └── AddExpenseSheet (modal/bottom-sheet, rendered at AppShell level so it can overlay any tab)
```

## Props & State

### `AppProvider`
- **State**: `config: PlanConfig | null`, `fixedExpenses: FixedExpenseItem[]`, `entries: ExpenseEntry[]`, `activeTab: TabId`, `advice: AdviceUIState`, `isSetupWizardOpen: boolean`
- **Actions exposed via `useAppState()`**: `saveSetup`, `addExpense`, `setActiveTab`, `openSetupWizard`, `closeSetupWizard`, `requestAdvice`

### `SetupWizard`
- **Props**: `initialDraft?: WizardDraftState` (present when reopened for editing; absent on first run)
- **State**: `WizardDraftState` (local, uncommitted until Step 3 "Finish Setup")
- **data-testid**: `setup-wizard-step1-income-input`, `setup-wizard-step1-goal-input`, `setup-wizard-step1-cycle-day-input`, `setup-wizard-step1-currency-input`, `setup-wizard-step1-next-button`, `setup-wizard-step2-expense-name-input`, `setup-wizard-step2-expense-amount-input`, `setup-wizard-step2-add-expense-button`, `setup-wizard-step2-next-button`, `setup-wizard-step3-weight-food-input` (and transport/entertainment/other), `setup-wizard-step3-finish-button`

### `TabBar`
- **Props**: `activeTab: TabId`, `onTabChange: (tab: TabId) => void`
- **data-testid**: `tab-bar-today-button`, `tab-bar-progress-button`, `tab-bar-advice-button`

### `TodaySummary`
- **Props**: `allowances: AllowanceBreakdown`, `feasible: boolean`
- Shows today's live rollover daily allowance per category (or total, whichever reads clearer — implementer's call at generation time) vs. today's spend.

### `CategoryBreakdown`
- **Props**: `allowances: AllowanceBreakdown`
- Month-to-date spend per category vs. that category's monthly allowance, one row per category.

### `InfeasibilityBanner`
- **Props**: `feasibility: FeasibilityResult`
- **data-testid**: `infeasibility-banner`

### `AddExpenseButton`
- **Props**: `onClick: () => void`
- **data-testid**: `add-expense-button` — fixed position, bottom of viewport, ≥44px tap target (NFR-1)

### `AddExpenseSheet`
- **Props**: `isOpen: boolean`, `defaultCategory: CategoryId`, `onSave: (input) => void`, `onClose: () => void`
- **State**: local form fields (`amount`, `category`, `date`, `note`)
- **data-testid**: `add-expense-amount-input` (`inputmode="decimal"`), `add-expense-category-select`, `add-expense-date-input`, `add-expense-note-input`, `add-expense-save-button`, `add-expense-cancel-button`

### `ProgressPanel`
- **Props**: `progress: ProgressResult`
- Renders "N/A — no goal set" and hides the progress bar when `progress.hasGoal === false` (Unit 1 Q2).
- **data-testid**: `progress-panel`, `progress-bar`, `progress-projection-warning` (conditional, shown when `onTrack === false`)

### `AdvicePanel`
- **Props**: `advice: AdviceUIState`, `onRequestAdvice: () => void`
- **data-testid**: `advice-get-button`, `advice-loading-spinner`, `advice-error-message`, `advice-retry-button`, `advice-content`, `advice-source-tag` (shows "Manual" or "Weekly overview")

## Interaction Flows
See `business-logic-model.md` for the setup wizard flow, add-expense two-tap flow, and advice request flow in full.

## Validation
See `business-rules.md` for the complete field-level validation table — enforced inline in `SetupWizard` and `AddExpenseSheet` before calling into `AppProvider` actions.

## API Integration Points
- `AddExpenseSheet` → `AppProvider.addExpense` → `TrackingService.addExpense` → `StoragePort` (no network call)
- `SetupWizard` → `AppProvider.saveSetup` → `PlanService.saveSetup` → `StoragePort` (no network call)
- `AdvicePanel` → `AppProvider.requestAdvice` → `AdviceOrchestrationService.requestAdvice` → `AdviceClient.fetchAdvice` → `POST /api/advice` (the only component chain that makes a network call)
