import { GoogleGenAI, Type } from '@google/genai';
import type { AdviceRequestPayload, AdviceResponse } from '../src/core/types';

export class GeminiAdviceError extends Error {}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    howToReachGoal: { type: Type.STRING },
    categoriesToTrim: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          // Categories are user-defined (CR2) - no fixed enum. The prompt instructs the
          // model to only use category ids from the list it was given.
          category: { type: Type.STRING },
          suggestedReductionAmount: { type: Type.NUMBER },
          reason: { type: Type.STRING },
        },
        required: ['category', 'suggestedReductionAmount', 'reason'],
      },
    },
    firstStep: { type: Type.STRING },
    tone: { type: Type.STRING, enum: ['encouragement', 'warning'] },
    message: { type: Type.STRING },
  },
  required: ['howToReachGoal', 'categoriesToTrim', 'firstStep', 'tone', 'message'],
} as const;

function buildPrompt(payload: AdviceRequestPayload): string {
  const categoryIds = Object.keys(payload.categorySpend);
  return `You are a plain-language personal finance coach for a budgeting app called Rollover.
You are given the user's ALREADY-COMPUTED plan numbers below. Do not recompute or
second-guess any of these numbers — treat them as ground truth and give advice based on them.
All amounts are in the user's own currency (${payload.currency}); do not add a currency symbol.
Categories have no fixed budget or limit in this app — spend per category is shown for
visibility only. When you mention a category in categoriesToTrim, use one of these exact
category ids: ${categoryIds.length > 0 ? categoryIds.join(', ') : '(none logged yet)'}.

Monthly income: ${payload.income}
Total fixed expenses: ${payload.fixedExpensesTotal}
Savings goal: ${payload.targetAmount} by ${payload.targetDate} (requires roughly ${payload.requiredMonthlyPace.toFixed(2)}/month to stay on pace)
Feasible: ${payload.feasibility.feasible}
${payload.feasibility.feasible ? '' : `Shortfall: ${payload.feasibility.shortfall}, largest feasible monthly pace right now: ${payload.feasibility.largestFeasibleGoal}`}

Spend so far this cycle, by category:
${categoryIds.length > 0 ? categoryIds.map((id) => `- ${id}: ${payload.categorySpend[id]}`).join('\n') : '(nothing logged yet this cycle)'}

Progress: ${
    payload.progress.hasGoal
      ? `${payload.progress.percentOfGoal?.toFixed(1)}% of goal reached, projected end-of-cycle savings this cycle ${payload.progress.projectedEndOfCycleSavings.toFixed(2)}, on track: ${payload.progress.onTrack}${payload.progress.onTrack === false ? `, projected shortfall ${payload.progress.projectedShortfall.toFixed(2)}` : ''}`
      : 'no savings goal set'
  }

Give: how to reach the goal, which categories to trim and roughly by how much, a realistic
first step, and set tone to "warning" if off track or infeasible, otherwise "encouragement".
Keep it concise, plain language, no financial jargon.`;
}

export async function getAdvice(payload: AdviceRequestPayload): Promise<AdviceResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiAdviceError('GEMINI_API_KEY is not configured on the server');
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const client = new GoogleGenAI({ apiKey });

  let text: string | undefined;
  try {
    const result = await client.models.generateContent({
      model,
      contents: buildPrompt(payload),
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    });
    text = result.text;
  } catch (error) {
    throw new GeminiAdviceError(`Gemini request failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!text) {
    throw new GeminiAdviceError('Gemini returned an empty response');
  }

  try {
    return JSON.parse(text) as AdviceResponse;
  } catch {
    throw new GeminiAdviceError('Gemini returned malformed JSON');
  }
}
