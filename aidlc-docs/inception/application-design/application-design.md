# Application Design — Rollover (Consolidated)

This consolidates `components.md`, `component-methods.md`, `services.md`, `component-dependency.md`. See those files for full detail; this is the summary view.

## Design Decisions (from application-design-plan.md)
1. **State management**: React Context + hooks (`AppProvider`), no external state library.
2. **Server framework**: Express, single `POST /api/advice` route.
3. **Repo layout**: single `package.json`, `src/` (Vite React client) + `server/` (Express proxy), two dev scripts.
4. **Category allocation**: user-configurable weights entered at Setup, validated to sum to 100% (feeds back into `requirements.md` FR-1/FR-2).
5. **Code organization**: layer-based — `src/core/` (Unit 1), `src/app/` (Unit 2 client), `server/` (Unit 2 server) — mirrors the unit split directly.

## Layers → Units Mapping
- **Core** (`src/core/`) = **Unit 1 — Core Engine & Storage**: `Models`, `PlanEngine`, `StoragePort`, `LocalStorageAdapter`. Pure, dependency-free, heavily tested (unit + partial PBT per NFR-4).
- **App** (`src/app/`) + **Server** (`server/`) = **Unit 2 — Web App & Advice Proxy**: UI components, `AppProvider`, the three client services, `AdviceClient`, plus the Express route and `GeminiAdviceService`. Depends on Unit 1's public interface only.

## Components (summary)
| Component | Layer | Purpose |
|---|---|---|
| `Models` | Core | Shared types |
| `PlanEngine` | Core | Deterministic financial calculations (pure functions) |
| `StoragePort` | Core | Persistence abstraction (interface) |
| `LocalStorageAdapter` | Core | `StoragePort` impl over `localStorage` |
| `AppProvider` | App | Root state/context, wires services together |
| `SetupScreen`, `MainScreen`, `AddExpenseSheet`, `ProgressPanel`, `AdvicePanel` | App (UI) | Mobile-first screens/sheets |
| `PlanService`, `TrackingService`, `AdviceOrchestrationService`, `AdviceClient` | App (services) | Orchestration between UI, Core, and the server |
| `AdviceProxyServer` | Server | Express app, `/api/advice` route |
| `GeminiAdviceService` | Server | Only component touching `@google/genai` |

## Dependency Rule
Core → nothing. App → Core (+ HTTP to Server). Server → Core `Models` (+ Gemini SDK). No reverse edges. This is what keeps the localStorage-swap and category-model-extensibility goals (NFR-2) architecturally unblocked.

## Open Items Carried to Functional Design (per-unit)
- **Unit 1**: exact rollover formula edge cases (day 1 of cycle, last day, `savingsGoal = 0`, negative-allowance flooring), cycle-window math for `cycleStartDay` near month-end (e.g. day 30/31 in short months), PBT property definitions (PBT-01).
- **Unit 2**: exact request/response JSON shape for `/api/advice` and the Gemini `responseSchema`, mobile screen composition detail (NFR-1 tap targets/thumb zone), weekly-overview UI labeling.
