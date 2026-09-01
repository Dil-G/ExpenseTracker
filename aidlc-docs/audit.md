# AI-DLC Audit Log

## Workspace Detection
**Timestamp**: 2026-09-01T00:00:00Z
**User Input**: "Using AI-DLC, build Rollover, a personal savings planner and daily expense tracker as a mobile-first single-page React + TypeScript web app. State persists in localStorage. A minimal server-side endpoint exists solely to proxy Claude API calls so the API key is never exposed to the browser.
Mobile-first: design and build for a phone screen first (360–430px wide) and scale up to desktop, not the other way around. Single-column layout, primary actions thumb-reachable near the bottom, tap targets at least 44px, numeric input modes on amount fields, no interaction that depends on hover. Adding an expense takes at most two taps from the main screen.
Setup: the user enters monthly net income, a monthly savings goal, and fixed monthly expenses (rent, insurance, subscriptions) as named items with amounts.
Deterministic plan engine: all financial calculations are plain arithmetic in typed, unit-tested functions — never delegated to the AI. Discretionary money available is income minus fixed expenses minus the savings goal, allocated across discretionary categories (food, transport, entertainment, other) as a monthly allowance and an implied daily allowance. If fixed expenses plus the savings goal exceed income, the engine reports the goal as infeasible along with the largest feasible goal and the shortfall amount.
AI advisory layer: the computed plan — income, fixed expenses, allowances, current spend, projection, feasibility — is sent to Claude, which returns personalised, plain-language coaching: how to reach the goal, which categories to trim and by roughly how much, what a realistic first step is, and encouragement or a warning based on current pace. The AI receives the numbers as input and never computes them. Its output is advisory prose and suggestions only; every figure shown in the UI comes from the deterministic engine. The app degrades gracefully when the AI call fails or is unavailable — the plan and tracking still work fully, with the advice panel showing an error state.
Daily tracking: the user logs expenses with amount, category, date, and note, and sees today's spend against the daily allowance plus month-to-date spend per category against its allowance.
Progress: progress toward the savings goal — effective savings so far this month (discretionary budget minus actual discretionary spend), percentage of goal reached, and a month-end projection from the spend rate so far, flagging when the user is on track to miss the goal and by how much.
AI integration: use the official Anthropic TypeScript SDK (@anthropic-ai/sdk) with model claude-opus-5, called only from the server-side proxy endpoint. Use structured outputs so the advice comes back in a typed shape the UI can render, rather than free-form text the frontend has to parse.
Out of scope for this build — backlog, do not implement now:
1. Cloud integration — replace localStorage with a hosted backend and per-user accounts, so data syncs across devices and survives a browser cache clear. Implies authentication, a real database, and a migration path from local-only data.
2. Sri Lankan card offers — surface currently available credit/debit card promotions in Sri Lanka (restaurant discounts, supermarket cashback, fuel offers) and connect them to the user's actual spending. Sourced by scraping or ingesting bank and aggregator offer pages on a schedule. Depends on item 1.
Design the current build so neither is blocked later: keep persistence behind a storage interface rather than calling localStorage directly from components, and keep the expense category model open to being matched against external offer data.
Target roughly 3.5 hours of implementation. Keep depth at standard, not comprehensive — this is a time-boxed learning project."
**AI Response**: "Workspace scanned: empty directory except AI-DLC rule files. Greenfield project confirmed. Created aidlc-docs/aidlc-state.md. Proceeding to Requirements Analysis."
**Context**: Workspace Detection - Greenfield, no approval required, auto-proceeding per workspace-detection.md Step 6.

---

## Requirements Analysis - Question File Issued
**Timestamp**: 2026-09-01T00:05:00Z
**User Input**: N/A (system-initiated)
**AI Response**: "Created aidlc-docs/inception/requirements/requirement-verification-questions.md with 3 extension opt-in questions and 4 product clarification questions (allowance model, monthly cycle boundary, AI advice trigger, currency). Requirements are otherwise exceptionally detailed and complete per user's initial request."
**Context**: Requirements Analysis Step 6 - Generate Clarifying Questions

---

## Requirements Analysis - Question File Answered
**Timestamp**: 2026-09-01T00:20:00Z
**User Input**: "Q1=A (true rollover). Q2=C, Other: 'User should be able to customize it.' (monthly cycle boundary should be user-configurable, not fixed to calendar month). Q3=C, Other: 'Manual + Weekly overview.' (AI advice trigger). Q4=C, Other: 'currency should be customizable based on customer preference.' Security Extensions=X, Other: 'Yes, we can skip for now. But, keep a backlog item for this.' Resiliency Extensions=X, Other: 'Yes, we can skip for now. But, keep a backlog item for this.' Property-Based Testing=B (Partial enforcement)."
**AI Response**: "Read all 7 answers. No contradictions detected. One ambiguity found (Q3 'weekly overview' mechanism unspecified) - resolving via documented assumption in requirements.md rather than a further question round, per time-boxed project constraint; flagged for user review at the requirements approval gate. Proceeding to generate requirements.md."
**Context**: Requirements Analysis Step 6/7 - Answers received, ambiguity resolution, requirements document generation

---

## Requirements Analysis - Approval Requested
**Timestamp**: 2026-09-01T00:25:00Z
**User Input**: N/A (system-initiated)
**AI Response**: "Generated aidlc-docs/inception/requirements/requirements.md (FR-1..FR-5, NFR-1..NFR-5, Out of Scope/Backlog). Assessed User Stories stage as not needed (single-user personal tool, no multiple personas/stakeholders, requirements already exhaustive) and recommending skip straight to Workflow Planning, with override option offered. Presenting completion message and requesting approval."
**Context**: Requirements Analysis Step 9 - Log and Proceed

---

## Requirements Analysis - Change Requested
**Timestamp**: 2026-09-01T00:30:00Z
**User Input**: "For AI integration, let's use Gemini. I will provide the API key"
**AI Response**: "Updated requirements.md: FR-5 and NFR-3 now specify Gemini (@google/genai SDK, responseSchema structured output) in place of Anthropic/Claude. Assumed model gemini-2.5-flash, flagged for review. Noted API key will be supplied by user at build time via server-side .env, never pasted in chat or committed. Re-presenting requirements for approval."
**Context**: Requirements Analysis - Request Changes cycle (AI provider swap)

---

## Requirements Analysis - Change Requested (2)
**Timestamp**: 2026-09-01T00:32:00Z
**User Input**: "Provide configuration in the server side to change gemini model."
**AI Response**: "Updated NFR-3: model now read from GEMINI_MODEL env var (default gemini-2.5-flash), changeable without code edit. API key/model both documented as .env-supplied. Re-presenting for approval."
**Context**: Requirements Analysis - Request Changes cycle (env-configurable model)

---

## Requirements Analysis - Approved
**Timestamp**: 2026-09-01T00:35:00Z
**User Input**: "Approve and continue"
**AI Response**: "Requirements approved as-is; User Stories skip confirmed (no override given). Proceeding to Workflow Planning."
**Context**: Requirements Analysis Step 9 gate - approved, proceeding

---

## Workflow Planning - Plan Presented
**Timestamp**: 2026-09-01T00:36:00Z
**User Input**: N/A (system-initiated)
**AI Response**: "Created aidlc-docs/inception/plans/execution-plan.md. Decomposed into 2 units (Core Engine & Storage; Web App & Advice Proxy). Recommending EXECUTE for Application Design, Units Generation, Functional Design (both units), NFR Requirements (Unit 1 only, decides stack once), Code Generation (both units), Build and Test. Recommending SKIP for User Stories (already decided), NFR Design (both units), Infrastructure Design (both units) - no infra beyond a local Node process. Presenting plan for approval."
**Context**: Workflow Planning Step 9 - Present Plan to User

---

## Workflow Planning - Approved
**Timestamp**: 2026-09-01T00:40:00Z
**User Input**: "why did we skip user stories ?" then "approve and continue"
**AI Response**: "Explained User Stories skip rationale in chat (solo app, brief already story-equivalent detail, time-box). User then approved execution plan as-is, no override. Proceeding to Application Design."
**Context**: Workflow Planning Step 9 gate - approved, proceeding to Application Design

---

## Application Design - Plan Answered & Executed
**Timestamp**: 2026-09-01T00:45:00Z
**User Input**: "Updated. Please proceed" (Q4 changed from A/equal-split to C/user-configurable weights entered at Setup; Q1/Q2/Q3/Q5 left at defaults A)
**AI Response**: "No ambiguity in answers. Updated requirements.md FR-1/FR-2 to reflect user-configurable category weights (supersedes the equal-split default). Generated components.md, component-methods.md, services.md, component-dependency.md, application-design.md. Design: React Context state, Express proxy, single-package two-folder layout, layer-based org mirroring the Unit1/Unit2 split."
**Context**: Application Design Steps 7-10 - answers collected, artifacts generated

---

## Application Design - Approved
**Timestamp**: 2026-09-01T00:50:00Z
**User Input**: "Approve and continue"
**AI Response**: "Application design approved. Proceeding to Units Generation."
**Context**: Application Design gate - approved, proceeding to Units Generation

---

## Units Generation - Plan Approved
**Timestamp**: 2026-09-01T00:55:00Z
**User Input**: "reviewed. Please proceed" (Q1 left at default A - keep 2-unit split)
**AI Response**: "No ambiguity. Generating unit-of-work.md, unit-of-work-dependency.md, unit-of-work-story-map.md per approved 2-unit split."
**Context**: Units Generation Part 1 approved, executing Part 2 - Generation

---

## Units Generation - Approved
**Timestamp**: 2026-09-01T01:00:00Z
**User Input**: "Approve and continue"
**AI Response**: "Units generation approved. Entering CONSTRUCTION PHASE, Unit 1 (Core Engine & Storage) Functional Design."
**Context**: Units Generation gate - approved, proceeding to CONSTRUCTION PHASE

---

## Functional Design (Unit 1) - Plan Answered & Executed
**Timestamp**: 2026-09-01T01:10:00Z
**User Input**: "Reviewad and approved" (Q1 changed to B - live/shrinking daily allowance; Q2 changed to B - hide progress bar when goal=0; Q3/Q4/Q5 left at default A)
**AI Response**: "No ambiguity. Fixed a logic bug found while writing business-logic-model.md: the feasible-branch largestFeasibleGoal formula was nonsensical - corrected to compute largestFeasibleGoal and shortfall unconditionally via max()/floor, independent of the feasible/infeasible branch. Generated business-logic-model.md, business-rules.md, domain-entities.md."
**Context**: Functional Design (Unit 1) Steps 5-6 - answers collected, artifacts generated

---

## Functional Design (Unit 1) - Approved
**Timestamp**: 2026-09-01T01:15:00Z
**User Input**: "continue to next stage"
**AI Response**: "Functional Design (Unit 1) approved. Proceeding to NFR Requirements (Unit 1)."
**Context**: Functional Design (Unit 1) gate - approved, proceeding to NFR Requirements

---

## NFR Requirements (Unit 1) - Plan Answered & Executed
**Timestamp**: 2026-09-01T01:20:00Z
**User Input**: "Review and proceed" (all 5 answers left at default A)
**AI Response**: "No ambiguity. Generating nfr-requirements.md and tech-stack-decisions.md - npm, latest stable deps unpinned, TS strict only (no ESLint), Node LTS unpinned, Express binds 127.0.0.1 only."
**Context**: NFR Requirements (Unit 1) Steps 5-6 - answers collected, artifacts generated

---

## NFR Requirements (Unit 1) - Approved
**Timestamp**: 2026-09-01T01:25:00Z
**User Input**: "continue to next stage"
**AI Response**: "NFR Requirements (Unit 1) approved. Proceeding to Code Generation (Unit 1)."
**Context**: NFR Requirements (Unit 1) gate - approved, proceeding to Code Generation

---

## Code Generation (Unit 1) - Plan Presented
**Timestamp**: 2026-09-01T01:30:00Z
**User Input**: N/A (system-initiated)
**AI Response**: "Created unit-1-core-engine-storage-code-generation-plan.md: 6 steps - whole-repo project structure setup, business logic (types + planEngine), business logic tests (example + PBT), storage layer, storage tests (example + PBT round-trip), documentation. Presenting for approval."
**Context**: Code Generation (Unit 1) Part 1 - Planning, requesting approval

---

## Code Generation (Unit 1) - Approved & Executed
**Timestamp**: 2026-09-01T01:35:00Z
**User Input**: "Approve and continue"
**AI Response**: "Executed all 6 steps. Ran actual test suite and typecheck (not just generated code blind): found and fixed 2 real bugs during verification - (1) a Vitest/Node tooling incompatibility where Node's native experimental webstorage global pre-empts Vitest's DOM environment's localStorage, worked around via cross-env NODE_OPTIONS=--no-experimental-webstorage on the test scripts; (2) a genuine fast-check generator bug (missing noInvalidDate:true) that PBT caught via an Invalid Date counterexample - fixed the generator. Also corrected package.json to real current dependency versions (npm view) after initial hand-written versions proved stale for this timeline (vitest 2->4, vite 5->8, React 18->19, etc.), deliberately keeping TypeScript on 5.9.3 rather than the new 7.x major to avoid ecosystem-compatibility risk in a time-boxed build. Final state: npm run typecheck clean, npm run test 31/31 passing."
**Context**: Code Generation (Unit 1) Part 2 - Generation complete and verified

---

## Code Generation (Unit 1) - Approved
**Timestamp**: 2026-09-01T01:40:00Z
**User Input**: "proceed"
**AI Response**: "Unit 1 approved and complete. Starting Unit 2 (Web App & Advice Proxy) Functional Design."
**Context**: Code Generation (Unit 1) gate - approved, proceeding to Unit 2 Functional Design

---

## Functional Design (Unit 2) - Plan Answered & Executed
**Timestamp**: 2026-09-01T01:50:00Z
**User Input**: "reviewed, proceed" (Q1=B tabs, Q2=A, Q3=B wizard, Q4=A, Q5=A; both B answers lacked specifics so added follow-up Q1a/Q3a per Step 8 mandatory ambiguity check - user then confirmed the lean defaults: 3 tabs (Today/Progress/Advice) + settings-icon re-entry, 3-step wizard (Income&Goal/Fixed Expenses/Category Weights))
**AI Response**: "Flagged the tabs+wizard combination adds more UI-state surface than the single-page default against the 3.5h time-box, then proceeded as answered, keeping both pieces as lean as possible (simple state-based tab switcher, not routing; simple step-index wizard, not multi-page). Generated business-logic-model.md, business-rules.md, domain-entities.md, frontend-components.md."
**Context**: Functional Design (Unit 2) Steps 5-6 - answers collected, ambiguity resolved via follow-up, artifacts generated

---

## Functional Design (Unit 2) - Approved
**Timestamp**: 2026-09-01T01:55:00Z
**User Input**: "continue to next stage"
**AI Response**: "Functional Design (Unit 2) approved. NFR Requirements/NFR Design/Infrastructure Design are SKIP for Unit 2 per execution-plan.md. Proceeding directly to Code Generation (Unit 2)."
**Context**: Functional Design (Unit 2) gate - approved, proceeding to Code Generation

---

## Code Generation (Unit 2) - Plan Presented
**Timestamp**: 2026-09-01T02:00:00Z
**User Input**: N/A (system-initiated)
**AI Response**: "Created unit-2-web-app-advice-proxy-code-generation-plan.md: 6 steps - server API layer + tests, client services + Vite proxy config, frontend components, targeted component tests (explicit scoping decision: small targeted set given Unit 1 already covers the heavy logic testing, plus manual verification in Build and Test), documentation + root README. Presenting for approval."
**Context**: Code Generation (Unit 2) Part 1 - Planning, requesting approval

---

## Code Generation (Unit 2) - Approved
**Timestamp**: 2026-09-01T02:05:00Z
**User Input**: "Approve and continue"
**AI Response**: "Executing Unit 2 code generation plan, steps 1-6."
**Context**: Code Generation (Unit 2) Part 2 - Generation, in progress

---

## Code Generation (Unit 2) - Completed
**Timestamp**: 2026-09-01T02:10:00Z
**User Input**: N/A (system-initiated)
**AI Response**: "Executed all 6 steps: server API layer (Express + Gemini structured output via @google/genai Type-based responseSchema, verified against installed package's actual .d.ts rather than assumed), client services + AppProvider, 9 frontend components + mobile-first CSS, targeted test suite (SetupWizard weight-gating, AddExpenseSheet two-tap flow, ProgressPanel conditional rendering, AdvicePanel error state), README + code-summary. Verification: npm run typecheck clean, npm run test 49/49 passing (10 files), npm run build succeeds (~209KB JS / 65KB gzip)."
**Context**: Code Generation (Unit 2) Part 2 - Generation complete and verified

---

## Change Request 2 - Requirements Analysis (new cycle)
**Timestamp**: 2026-09-01T02:30:00Z
**User Input**: "needs these requiremetn changes: merge today and Progress tab with daily/monthly toggle; remove Advice tab, fold into overview as a segment; remove Category Weights modal, show each category as x/total income; add recurring payments, perhaps a new tab; add Transactions tab showing full history; add Settings section to manage custom categories; goals should be dynamic-duration (e.g. 500000 in 6 months), not strictly monthly."
**AI Response**: "Assessed scope: several items are structural (open/custom categories replacing the fixed CategoryId union, multi-month goal semantics requiring a persisted savings ledger since nothing currently accumulates across cycle boundaries, recurring payments as a new engine concept, navigation IA changes affecting most screens) rather than UI tweaks - reopening Requirements Analysis per project workflow instead of guessing and risking hours of rework. Created change-request-2-questions.md with 7 questions, flagging Q1 (multi-month goal ledger) and Q2 (whether removing category weights also removes the per-category rollover mechanic the app is named after) as the two decisions most consequential to get right before touching code."
**Context**: Requirements Analysis reopened on existing (brownfield) codebase - questions issued, awaiting answers

---

## Change Request 2 - Questions Answered
**Timestamp**: 2026-09-01T02:40:00Z
**User Input**: "reviewed, proceed" (Q1=A persisted ledger, Q2=C changed from default B to full removal of rollover/daily-allowance/per-category budgeting entirely - flat monthly budget number only, categories become pure spend-visibility, Q3=A, Q4=A, Q5=A, Q6=B changed from default A to 4 tabs (Overview/Transactions/Recurring/Settings), Q7=A)
**AI Response**: "Flagged Q2=C as a deliberate, informed reversal of the app's core rollover mechanic (user picked it after the tradeoff was laid out explicitly, not proceeding blind). Noted a knock-on reconciliation: Q7's Daily view description referenced 'today's rollover allowance', which no longer exists under Q2=C - resolving Daily view to show today's spend only (no allowance comparison), stated directly rather than reopening another question round. Proceeding to write updated requirements covering all 7 decisions."
**Context**: Requirements Analysis (CR2) - answers collected, no blocking contradictions, one reconciliation noted inline

---

## Change Request 2 - Requirements Document Presented
**Timestamp**: 2026-09-01T02:45:00Z
**User Input**: N/A (system-initiated)
**AI Response**: "Created change-request-2-requirements.md: full domain model (Category, Goal, SavingsLedgerState, RecurringPayment), migration strategy for existing entries (seed default categories with matching ids, zero-transform), FR-1 through FR-7, 4-tab navigation. Presenting for approval before implementation."
**Context**: Requirements Analysis (CR2) - requirements document complete, requesting approval

---

## Change Request 2 - Approved & Implemented
**Timestamp**: 2026-09-01T03:15:00Z
**User Input**: "Approve and continue"
**AI Response**: "Implemented directly (no separate Application Design/Units Generation ceremony - iterative change on an understood codebase, verified continuously instead). Rewrote core types, planEngine (new: computeRequiredMonthlyPace, updateSavingsLedger; removed: category allowance/weight functions), StoragePort/LocalStorageAdapter (categories with default-seed migration, goal, ledger, recurring payments), all app services, AppProvider, and every UI component (4-tab nav: Overview/Transactions/Recurring/Settings). Found and fixed a real double-banking bug in updateSavingsLedger (resume cursor started at the last-banked cycle instead of the next one) plus two CSS regressions and 4 stray em-dashes during manual verification. Final: typecheck clean, 55/55 tests passing, build succeeds, manually verified all 4 tabs in-browser including recurring-payment auto-logging."
**Context**: Change Request 2 complete - see aidlc-docs/construction/change-request-2-code-summary.md
## Gemini Advice Integration - Live Verification & Fix
**Timestamp**: 2026-09-01T14:50:00Z
**User Input**: "here integrate gemini to the expensetracker, inorder to get the advice section working"
**AI Response**: "Found the Gemini integration already implemented (server/geminiAdviceService.ts, /api/advice proxy, adviceClient, AdvicePanel) but non-functional end to end. Two defects found and fixed by live verification against the real Gemini API: (1) GEMINI_MODEL `gemini-2.5-flash` is retired - the API returns 404 telling new users to move to `gemini-3.6-flash`; updated .env, .env.example, the server default and README. (2) vite.config.ts derived the /api proxy target from `process.env.PORT`, which hosts/launchers set to the *web* port - the proxy aimed at Vite itself and every advice call 502'd; renamed the API server's port var to `API_PORT` across .env, .env.example, server/app.ts, vite.config.ts and README. Verified: real Gemini call returns schema-valid advice (HTTP 200) and the Advice panel renders the weekly overview in the browser. typecheck clean, 55/55 tests pass."
**Context**: Brownfield bug fix within existing component boundaries - no new components, models or user-facing features, so Requirements/Stories/Design stages assessed as not adding value (per CLAUDE.md adaptive workflow "SKIP ONLY IF: simple bug fixes with clear, isolated scope").

---
