# Code Generation Plan — Unit 2: Web App & Advice Proxy

Workspace root: `C:\ExpenseTracker`. Depends on Unit 1 (`src/core/`), already generated and tested.

**Requirements covered**: FR-1, FR-3, FR-5, NFR-1, NFR-3 (see `unit-of-work-story-map.md`).

**Testing scope decision** (explicit, not a silent skip): Unit 1 already carries the heavy automated-testing burden (example + partial PBT on the actual financial logic). Unit 2 is comparatively thin UI wiring over an already-tested engine. Full component-test coverage of every screen would cost more of the 3.5h box than it returns for a solo learning project — instead: a **small, targeted set** of component tests on the pieces with real conditional logic (weight-sum validation gating, two-tap save behavior, conditional rendering branches), plus **manual mobile-viewport verification** in Build and Test for the rest. Adds `@testing-library/react` + `@testing-library/user-event` (small, standard, justified) and `supertest` (server route testing, standard, justified) as dev dependencies.

## Steps

- [x] **Step 1 — API Layer Generation (server)**
  - `server/geminiAdviceService.ts` — `getAdvice()`, builds prompt, calls `@google/genai` with `responseSchema` from `domain-entities.md`
  - `server/app.ts` — Express app, `POST /api/advice`, request validation, error mapping, binds `127.0.0.1`, reads `PORT`/`GEMINI_API_KEY`/`GEMINI_MODEL` via `process.loadEnvFile('.env')` (Node built-in, no `dotenv` dependency)

- [x] **Step 2 — API Layer Unit Testing**
  - `server/geminiAdviceService.test.ts` — mocked `@google/genai` client: success mapping, malformed-response error, SDK-throw error
  - `server/app.test.ts` (`supertest`) — valid payload → 200; missing required field → 400 before any Gemini call; service throws → 502 with generic message (no raw error leaked)

- [x] **Step 3 — Client Service Layer Generation**
  - `src/app/services/planService.ts`, `trackingService.ts`, `adviceService.ts`, `adviceClient.ts`
  - `src/app/state/AppProvider.tsx`
  - `vite.config.ts` update: dev server proxy `/api` → `http://127.0.0.1:$PORT` (same-origin calls from the client, no CORS handling needed)

- [x] **Step 4 — Frontend Components Generation**
  - `src/app/components/`: `SetupWizard` (+ 3 step components), `TabBar`, `TodaySummary`, `CategoryBreakdown`, `InfeasibilityBanner`, `AddExpenseButton`, `AddExpenseSheet`, `ProgressPanel`, `AdvicePanel`
  - `src/app/App.tsx`, `src/app/main.tsx`, `src/index.css` (mobile-first base styles, 44px tap targets)
  - `index.html`

- [x] **Step 5 — Frontend Components Unit Testing** (targeted scope — see decision above)
  - Category weights step: "Finish Setup" disabled until weights sum to 100
  - `AddExpenseSheet`: two-tap save calls `onSave` with pre-filled defaults (today's date, last-used category)
  - `ProgressPanel`: hides progress bar when `hasGoal === false`
  - `AdvicePanel`: renders error + Retry on `status: 'error'`, doesn't affect other tabs' render

- [x] **Step 6 — Documentation Generation**
  - `aidlc-docs/construction/unit-2-web-app-advice-proxy/code/code-summary.md`
  - Root `README.md` — run instructions (client + server dev commands), `.env` setup, project structure overview (whole-project doc, natural home is here since this is the last unit)

**No** database migrations (no DB). **No** separate deployment artifacts step — this is a local dev tool, run instructions in `README.md` cover it (matches Infrastructure Design being skipped for both units).
