# Rollover

A mobile-first personal savings planner and daily expense tracker. All financial math is deterministic (`src/core/planEngine.ts`, unit + property tested); Gemini only adds plain-language coaching on top of numbers it never computes.

## Project Structure

```
src/
  core/       - deterministic engine, types, storage (Unit 1)
  app/        - React UI, client services (Unit 2)
server/       - Express proxy to Gemini (Unit 2)
```

## Setup

```bash
npm install
cp .env.example .env
# then edit .env and set GEMINI_API_KEY (get one from https://aistudio.google.com/apikey)
```

## Running locally

Two processes, in two terminals:

```bash
npm run dev         # Vite dev server (client) - http://localhost:5173
npm run dev:server  # Express advice proxy - http://127.0.0.1:3001
```

The client proxies `/api/*` requests to the server during dev (see `vite.config.ts`), so just open http://localhost:5173.

## Testing

```bash
npm run test        # all tests (example-based + property-based), once
npm run test:watch  # watch mode
npm run typecheck
```

## Environment Variables (`.env`, server-side only — never exposed to the browser)

| Var | Required | Default |
|---|---|---|
| `GEMINI_API_KEY` | Yes | — |
| `GEMINI_MODEL` | No | `gemini-3.6-flash` |
| `API_PORT` | No | `3001` |

## Out of Scope (backlog)

- Cloud sync / accounts (persistence is behind a `StoragePort` interface specifically so this can be added later without touching call sites)
- Sri Lankan card offer matching against spending categories
- Full Security/Resiliency baseline hardening (deferred; see `aidlc-docs/inception/requirements/requirements.md`)

## Full Design & Process Docs

See `aidlc-docs/` for the complete AI-DLC trail: requirements, application design, functional design, and code summaries for both units.
