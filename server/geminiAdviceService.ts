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
          category: { type: Type.STRING, enum: ['food', 'transport', 'entertainment', 'other'] },
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
  return `You are a plain-language personal finance coach for a budgeting app called Rollover.
You are given the user's ALREADY-COMPUTED monthly plan numbers below. Do not recompute or
second-guess any of these numbers — treat them as ground truth and give advice based on them.
All amounts are in the user's own currency (${payload.currency}); do not add a currency symbol.

Monthly income: ${payload.income}
Total fixed expenses: ${payload.fixedExpensesTotal}
Savings goal: ${payload.savingsGoal}
Feasible: ${payload.feasibility.feasible}
${payload.feasibility.feasible ? '' : `Shortfall: ${payload.feasibility.shortfall}, largest feasible goal: ${payload.feasibility.largestFeasibleGoal}`}

Category allowances and spend so far this cycle:
${Object.entries(payload.categoryAllowances)
  .map(([category, a]) => `- ${category}: monthly allowance ${a.monthlyAllowance}, spent so far ${a.spentThisCycle}, daily allowance ${a.dailyAllowance.toFixed(2)}`)
  .join('\n')}

Progress: ${
    payload.progress.hasGoal
      ? `${payload.progress.percentOfGoal?.toFixed(1)}% of goal reached, projected end-of-cycle savings ${payload.progress.projectedEndOfCycleSavings.toFixed(2)}, on track: ${payload.progress.onTrack}${payload.progress.onTrack === false ? `, projected shortfall ${payload.progress.projectedShortfall.toFixed(2)}` : ''}`
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
