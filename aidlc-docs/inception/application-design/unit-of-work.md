# Unit of Work — Rollover

2 units, sequential build order (Unit 1 → Unit 2), matches the layer split from Application Design.

## Unit 1 — Core Engine & Storage

**Type**: Module (not independently deployable — a library consumed by Unit 2)
**Location**: `src/core/`
**Responsibilities**: `Models` (types), `PlanEngine` (deterministic calculations), `StoragePort` (interface), `LocalStorageAdapter` (implementation)
**Depends on**: nothing (no other unit, no browser/server APIs beyond `window.localStorage`)
**Consumed by**: Unit 2
**Why its own unit**: it's the one place correctness really matters (rollover/feasibility/progress math) and the one place PBT applies (NFR-4) — isolating it lets it be fully designed, coded, and tested before any UI exists to build against it.

## Unit 2 — Web App & Advice Proxy

**Type**: Module (the deployable application: browser bundle + one local Node process)
**Location**: `src/app/` (client) + `server/` (Express proxy)
**Responsibilities**: all UI components, `AppProvider` + client services (`PlanService`, `TrackingService`, `AdviceOrchestrationService`, `AdviceClient`), the Express route, `GeminiAdviceService`
**Depends on**: Unit 1 (imports `PlanEngine`, `StoragePort`/`LocalStorageAdapter`, `Models`)
**Consumed by**: end user (this is the top of the dependency graph — nothing depends on it)
**Why grouped together (not 3 units)**: the server proxy is a single thin pass-through (one route, one external call) with no independent lifecycle, scaling profile, or team boundary distinct from the client — splitting it out would add coordination overhead with no benefit for a 3.5h build (per approved Unit Plan Q1).

## Code Organization Strategy (Greenfield)

```
ExpenseTracker/
├── src/
│   ├── core/                  # Unit 1
│   │   ├── types.ts
│   │   ├── planEngine.ts
│   │   ├── planEngine.test.ts
│   │   ├── planEngine.pbt.test.ts
│   │   └── storage/
│   │       ├── storagePort.ts
│   │       ├── localStorageAdapter.ts
│   │       └── localStorageAdapter.test.ts
│   ├── app/                   # Unit 2 (client)
│   │   ├── state/AppProvider.tsx
│   │   ├── services/
│   │   │   ├── planService.ts
│   │   │   ├── trackingService.ts
│   │   │   ├── adviceService.ts
│   │   │   └── adviceClient.ts
│   │   ├── components/
│   │   │   ├── SetupScreen.tsx
│   │   │   ├── MainScreen.tsx
│   │   │   ├── AddExpenseSheet.tsx
│   │   │   ├── ProgressPanel.tsx
│   │   │   └── AdvicePanel.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── index.css
├── server/                    # Unit 2 (server)
│   ├── app.ts
│   └── geminiAdviceService.ts
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env.example
```

Single `package.json`, no workspaces (per Application Design Q3). `server/` is plain TypeScript run via `tsx` in dev, not bundled by Vite.
