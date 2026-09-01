# Unit of Work — Requirement Map — Rollover

User Stories was skipped (see `requirements.md` intent analysis and Workflow Planning rationale), so this maps `requirements.md` functional/non-functional requirements directly to units instead of stories.

| Requirement | Description | Unit |
|---|---|---|
| FR-1 | Setup: income, goal, fixed expenses, cycle start day, currency, category weights | Unit 2 (UI: `SetupScreen`) + Unit 1 (`Models`, persisted via `StoragePort`) |
| FR-2 | Deterministic plan engine: discretionary budget, feasibility, category allowances, rollover daily allowance, cycle boundary | Unit 1 (`PlanEngine`) |
| FR-3 | Daily expense tracking: log expense, two-tap add, today/MTD views | Unit 2 (`AddExpenseSheet`, `MainScreen`, `TrackingService`) + Unit 1 (`PlanEngine` spend aggregation) |
| FR-4 | Savings goal progress: effective savings, % of goal, month-end projection | Unit 1 (`PlanEngine.computeProgress`) + Unit 2 (`ProgressPanel` display) |
| FR-5 | AI advisory layer: Gemini structured advice, manual + weekly trigger, graceful degradation | Unit 2 (`AdviceOrchestrationService`, `AdviceClient`, `AdvicePanel`, `AdviceProxyServer`, `GeminiAdviceService`) |
| NFR-1 | Mobile-first UI (tap targets, thumb zone, numeric input) | Unit 2 (all UI components) |
| NFR-2 | Storage abstraction + open category model | Unit 1 (`StoragePort`, `Models.CategoryId`) |
| NFR-3 | Gemini SDK integration, server-only, configurable model | Unit 2 (`GeminiAdviceService`) |
| NFR-4 | Unit + partial PBT testing on the engine | Unit 1 (test files) |
| NFR-5 | Security/Resiliency extensions (backlogged) | N/A this build — not assigned to either unit |

**Coverage check**: every FR (1–5) and every in-scope NFR (1–4) is assigned to at least one unit. NFR-5 is explicitly out of scope for this build (backlog item), so intentionally unassigned.
