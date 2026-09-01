# Domain Entities — Unit 2: Web App & Advice Proxy

Unit 2 reuses all persisted/derived types from Unit 1's `src/core/types.ts` (`PlanConfig`, `FixedExpenseItem`, `ExpenseEntry`, `AllowanceBreakdown`, `ProgressResult`, `FeasibilityResult`, `AdviceRequestPayload`, `AdviceResponse`) without redefining them. This document covers only the UI-local/transient types new to Unit 2.

## UI-Local Types (not persisted)

```ts
type TabId = 'today' | 'progress' | 'advice';

type WizardStep = 1 | 2 | 3; // Income & Goal | Fixed Expenses | Category Weights

interface WizardDraftState {
  step: WizardStep;
  monthlyIncome: string;   // form fields are strings while editing, parsed/validated on submit
  savingsGoal: string;
  cycleStartDay: string;
  currency: string;
  fixedExpenses: FixedExpenseItem[];
  categoryWeights: CategoryWeights;
}

type AdviceUIStatus = 'idle' | 'loading' | 'success' | 'error';

interface AdviceUIState {
  status: AdviceUIStatus;
  data: AdviceResponse | null;
  errorMessage: string | null;
  lastFetchKind: 'manual' | 'weekly' | null;
  lastFetchAt: string | null; // ISO timestamp, mirrors StoragePort.getLastAdviceFetchAt()
}
```

## Server-Side Request/Response (HTTP boundary)

```ts
// POST /api/advice
// Request body: AdviceRequestPayload (from Unit 1's types.ts)
// 200 response body: AdviceResponse (from Unit 1's types.ts)
// 400 response body: { error: string }   -- payload failed validation
// 502 response body: { error: string }   -- Gemini call failed (network, API error, or malformed structured output)
```

## Gemini Structured Output Mapping

`GeminiAdviceService` requests a `responseSchema` (JSON Schema) shaped to match `AdviceResponse` exactly:
```json
{
  "type": "object",
  "properties": {
    "howToReachGoal": { "type": "string" },
    "categoriesToTrim": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "category": { "type": "string", "enum": ["food", "transport", "entertainment", "other"] },
          "suggestedReductionAmount": { "type": "number" },
          "reason": { "type": "string" }
        },
        "required": ["category", "suggestedReductionAmount", "reason"]
      }
    },
    "firstStep": { "type": "string" },
    "tone": { "type": "string", "enum": ["encouragement", "warning"] },
    "message": { "type": "string" }
  },
  "required": ["howToReachGoal", "categoriesToTrim", "firstStep", "tone", "message"]
}
```
