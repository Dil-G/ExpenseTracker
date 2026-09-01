// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdviceRequestPayload } from '../src/core/types';

const generateContentMock = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function () {
    return { models: { generateContent: generateContentMock } };
  }),
  Type: { OBJECT: 'OBJECT', STRING: 'STRING', NUMBER: 'NUMBER', ARRAY: 'ARRAY' },
}));

const { getAdvice, GeminiAdviceError } = await import('./geminiAdviceService');

const PAYLOAD: AdviceRequestPayload = {
  income: 3000,
  fixedExpensesTotal: 1100,
  targetAmount: 6000,
  targetDate: '2027-01-01',
  requiredMonthlyPace: 500,
  currency: 'USD',
  feasibility: { feasible: true, discretionaryBudget: 1400, shortfall: 0, largestFeasibleGoal: 1900 },
  categorySpend: {
    food: 100,
    transport: 50,
    entertainment: 0,
    other: 20,
  },
  progress: {
    hasGoal: true,
    totalSavedSoFar: 1230,
    percentOfGoal: 20.5,
    requiredMonthlyPace: 500,
    projectedEndOfCycleSavings: 1230,
    onTrack: true,
    projectedShortfall: 0,
    dailySpendRate: 20,
  },
};

describe('getAdvice', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    generateContentMock.mockReset();
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
  });

  it('parses a valid structured response into AdviceResponse', async () => {
    const response = {
      howToReachGoal: 'Trim food a bit.',
      categoriesToTrim: [{ category: 'food', suggestedReductionAmount: 20, reason: 'Slightly over pace' }],
      firstStep: 'Track lunches this week.',
      tone: 'encouragement',
      message: 'You are doing well.',
    };
    generateContentMock.mockResolvedValue({ text: JSON.stringify(response) });

    const result = await getAdvice(PAYLOAD);
    expect(result).toEqual(response);
  });

  it('throws GeminiAdviceError when GEMINI_API_KEY is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(getAdvice(PAYLOAD)).rejects.toThrow(GeminiAdviceError);
  });

  it('throws GeminiAdviceError when the SDK call rejects', async () => {
    generateContentMock.mockRejectedValue(new Error('network down'));
    await expect(getAdvice(PAYLOAD)).rejects.toThrow(GeminiAdviceError);
  });

  it('throws GeminiAdviceError when the response text is malformed JSON', async () => {
    generateContentMock.mockResolvedValue({ text: 'not json{{{' });
    await expect(getAdvice(PAYLOAD)).rejects.toThrow(GeminiAdviceError);
  });

  it('throws GeminiAdviceError when the response has no text', async () => {
    generateContentMock.mockResolvedValue({ text: undefined });
    await expect(getAdvice(PAYLOAD)).rejects.toThrow(GeminiAdviceError);
  });

  it('uses GEMINI_MODEL env var when set', async () => {
    process.env.GEMINI_MODEL = 'gemini-custom-model';
    generateContentMock.mockResolvedValue({
      text: JSON.stringify({
        howToReachGoal: 'x',
        categoriesToTrim: [],
        firstStep: 'x',
        tone: 'encouragement',
        message: 'x',
      }),
    });
    await getAdvice(PAYLOAD);
    expect(generateContentMock).toHaveBeenCalledWith(expect.objectContaining({ model: 'gemini-custom-model' }));
  });
});
