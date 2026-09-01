# Code Summary — Unit 2: Web App & Advice Proxy

## Files Created

**Server (Step 1 & 2):**
- `server/geminiAdviceService.ts` — `getAdvice()`, prompt construction, `@google/genai` structured-output call (`Type`-based `responseSchema` matching `AdviceResponse` exactly)
- `server/app.ts` — Express app, `POST /api/advice`, payload validation (rejects before calling Gemini), error mapping (502 with generic message, never leaks raw SDK error), binds `127.0.0.1`, loads `.env` via `process.loadEnvFile()` (Node built-in, no `dotenv` dependency)
- `server/geminiAdviceService.test.ts`, `server/app.test.ts` (`supertest`)

**Client services (Step 3):**
- `src/app/services/planService.ts` — `buildPlanView`, `weightsSumTo100`, `saveSetup`
- `src/app/services/trackingService.ts` — `buildAllowanceBreakdown`, `buildProgress`, `addExpense`
- `src/app/services/adviceService.ts` — `shouldAutoFetchWeekly` (7-day check), `buildAdviceRequestPayload`
- `src/app/services/adviceClient.ts` — `fetchAdvice` (POST `/api/advice`)
- `src/app/state/AppProvider.tsx` — root context, wires everything together, owns the `LocalStorageAdapter` instance
- `vite.config.ts` — dev proxy `/api` → `http://127.0.0.1:$PORT`

**Frontend components (Step 4):**
- `src/app/components/`: `SetupWizard` (3-step), `TabBar`, `TodaySummary`, `CategoryBreakdown`, `InfeasibilityBanner`, `AddExpenseButton`, `AddExpenseSheet`, `ProgressPanel`, `AdvicePanel`
- `src/app/App.tsx`, `src/app/main.tsx`, `src/index.css` (mobile-first, 44px tap targets, fixed bottom nav + FAB), `index.html`

**Tests (Step 5, targeted scope per plan):**
- `src/app/components/SetupWizard.test.tsx` — weight-sum gating on "Finish Setup"
- `src/app/components/AddExpenseSheet.test.tsx` — two-tap save with pre-filled defaults
- `src/app/components/ProgressPanel.test.tsx` — hides bar when `hasGoal=false`, shows miss-warning
- `src/app/components/AdvicePanel.test.tsx` — error + Retry state, doesn't crash on failure
- `src/test-setup.ts` — jest-dom matchers + RTL auto-cleanup

**Docs:**
- `README.md` (root) — run instructions, env vars, project structure
- This file

## Verification
```
npm run typecheck  -> clean
npm run test       -> 10 test files, 49 tests, all passing
npm run build      -> succeeds, ~209KB JS (65KB gzip)
```

## Requirement Coverage
- **FR-1** (Setup): `SetupWizard` (3 steps) + `planService.saveSetup`
- **FR-3** (Tracking, two-tap add): `AddExpenseButton` + `AddExpenseSheet` + `trackingService.addExpense`
- **FR-5** (AI advisory, graceful degradation): `AdviceOrchestrationService`-equivalent logic in `AppProvider.requestAdvice` + `AdvicePanel` error state; Today/Progress tabs never depend on advice state
- **NFR-1** (Mobile-first): `src/index.css` — 44px targets, single-column, fixed thumb-reachable Add button, `inputmode="decimal"` on amount fields
- **NFR-3** (Gemini integration): `geminiAdviceService.ts`, server-only, `GEMINI_MODEL` configurable

## Notes / Deviations
- `PlanService`/`TrackingService`/`AdviceOrchestrationService` from `component-methods.md` were designed as React hooks; implemented instead as plain functions consumed by the single `AppProvider` component. Same responsibilities, avoids redundant recomputation across multiple hook instances.
- Weekly auto-advice check runs once per app-load (on `config` becoming available), not on a timer — matches the client-side "check on open" design in `requirements.md` FR-5.
