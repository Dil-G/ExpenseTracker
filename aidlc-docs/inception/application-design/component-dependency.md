# Component Dependencies — Rollover

## Dependency Matrix

| Component | Depends On | Layer |
|---|---|---|
| `Models` (types) | — | Core |
| `PlanEngine` | `Models` | Core |
| `StoragePort` | `Models` | Core |
| `LocalStorageAdapter` | `StoragePort`, `Models`, `window.localStorage` | Core |
| `AppProvider` | `LocalStorageAdapter`, `PlanService`, `TrackingService`, `AdviceOrchestrationService` | App |
| `PlanService` | `StoragePort`, `PlanEngine` | App |
| `TrackingService` | `StoragePort`, `PlanEngine`, `PlanService` (cycle window) | App |
| `AdviceOrchestrationService` | `AdviceClient`, `StoragePort`, `PlanService`, `TrackingService` | App |
| `AdviceClient` | `fetch` (HTTP to `AdviceProxyServer`) | App |
| `SetupScreen`, `MainScreen`, `AddExpenseSheet`, `ProgressPanel`, `AdvicePanel` | `AppProvider` (via `useAppState()`) | App (UI) |
| `AdviceProxyServer` | `GeminiAdviceService`, `Models` | Server |
| `GeminiAdviceService` | `@google/genai`, `Models`, server env (`GEMINI_API_KEY`, `GEMINI_MODEL`) | Server |

**Dependency direction is one-way**: Core has zero knowledge of App or Server. App knows Core, not Server internals (only talks to it over HTTP via `AdviceClient`). Server knows Core's shared `Models` types (imported, not coupled to browser code) but nothing about React/UI.

## Data Flow Diagram

```mermaid
flowchart LR
    UI["UI Components<br/>Setup / Main / AddExpense / Progress / Advice"]
    AP["AppProvider"]
    PS["PlanService"]
    TS["TrackingService"]
    AOS["AdviceOrchestrationService"]
    AC["AdviceClient"]
    PE["PlanEngine"]
    SP["StoragePort"]
    LSA["LocalStorageAdapter"]
    LS[("localStorage")]
    APS["AdviceProxyServer"]
    GAS["GeminiAdviceService"]
    GEM[("Gemini API")]

    UI --> AP
    AP --> PS
    AP --> TS
    AP --> AOS
    PS --> SP
    PS --> PE
    TS --> SP
    TS --> PE
    AOS --> AC
    AOS --> SP
    SP --> LSA
    LSA --> LS
    AC -- HTTP POST /api/advice --> APS
    APS --> GAS
    GAS -- SDK call --> GEM

    style UI fill:#BBDEFB,stroke:#1565C0,stroke-width:2px,color:#000
    style AP fill:#BBDEFB,stroke:#1565C0,stroke-width:2px,color:#000
    style PS fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px,color:#000
    style TS fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px,color:#000
    style AOS fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px,color:#000
    style AC fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px,color:#000
    style PE fill:#FFF59D,stroke:#F57F17,stroke-width:2px,color:#000
    style SP fill:#FFF59D,stroke:#F57F17,stroke-width:2px,color:#000
    style LSA fill:#FFF59D,stroke:#F57F17,stroke-width:2px,color:#000
    style APS fill:#FFCCBC,stroke:#BF360C,stroke-width:2px,color:#000
    style GAS fill:#FFCCBC,stroke:#BF360C,stroke-width:2px,color:#000
```

### Text Alternative
```
UI components -> AppProvider -> {PlanService, TrackingService, AdviceOrchestrationService}
PlanService -> StoragePort -> LocalStorageAdapter -> localStorage
PlanService -> PlanEngine
TrackingService -> StoragePort, PlanEngine
AdviceOrchestrationService -> AdviceClient -> HTTP -> AdviceProxyServer -> GeminiAdviceService -> Gemini API
                            -> StoragePort (advice metadata)
```

**Legend**: blue = App/UI shell, green = client services, yellow = Core (Unit 1), orange = Server (proxy).
