# Unit of Work Dependency — Rollover

## Dependency Matrix

| Unit | Depends On | Consumed By | Build Order |
|---|---|---|---|
| Unit 1 — Core Engine & Storage | None | Unit 2 | 1st |
| Unit 2 — Web App & Advice Proxy | Unit 1 | End user | 2nd |

No cycles, no parallel-build opportunity (Unit 2 needs Unit 1's finished, tested interface — `PlanEngine` function signatures and `StoragePort` contract — before UI/service code can be written against it meaningfully).

## Diagram

```mermaid
flowchart LR
    U1["Unit 1: Core Engine and Storage"]
    U2["Unit 2: Web App and Advice Proxy"]
    User(["End User"])

    U1 --> U2
    U2 --> User

    style U1 fill:#FFF59D,stroke:#F57F17,stroke-width:3px,color:#000
    style U2 fill:#C8E6C9,stroke:#2E7D32,stroke-width:3px,color:#000
    style User fill:#CE93D8,stroke:#6A1B9A,stroke-width:3px,color:#000
```

### Text Alternative
```
Unit 1 (Core Engine and Storage) --> Unit 2 (Web App and Advice Proxy) --> End User
```

## Integration Point

Unit 2 imports Unit 1's public surface directly (same repo, same TS project — no network boundary between them, only the browser↔server HTTP boundary inside Unit 2 itself, between the client services and the Express route). No versioning/contract-testing concerns beyond normal TypeScript compile-time checking.
