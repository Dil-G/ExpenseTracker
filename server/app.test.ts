// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

process.env.NODE_ENV = 'test'; // prevent app.ts's top-level listen() from binding a port during tests

const getAdviceMock = vi.fn();
vi.mock('./geminiAdviceService', () => ({
  getAdvice: getAdviceMock,
  GeminiAdviceError: class GeminiAdviceError extends Error {},
}));

const { createApp } = await import('./app');

const VALID_PAYLOAD = {
  income: 3000,
  fixedExpensesTotal: 1100,
  savingsGoal: 500,
  currency: 'USD',
  feasibility: { feasible: true, discretionaryBudget: 1400, shortfall: 0, largestFeasibleGoal: 1900 },
  categoryAllowances: {
    food: { monthlyAllowance: 560, spentThisCycle: 100, remainingBudget: 460, dailyAllowance: 15 },
    transport: { monthlyAllowance: 350, spentThisCycle: 50, remainingBudget: 300, dailyAllowance: 10 },
    entertainment: { monthlyAllowance: 210, spentThisCycle: 0, remainingBudget: 210, dailyAllowance: 7 },
    other: { monthlyAllowance: 280, spentThisCycle: 20, remainingBudget: 260, dailyAllowance: 8.6 },
  },
  progress: { hasGoal: true, effectiveSavings: 1230, percentOfGoal: 246, projectedEndOfCycleSavings: 1230, onTrack: true, projectedShortfall: 0 },
};

describe('POST /api/advice', () => {
  beforeEach(() => {
    getAdviceMock.mockReset();
  });

  it('returns 200 with the advice for a valid payload', async () => {
    const advice = { howToReachGoal: 'x', categoriesToTrim: [], firstStep: 'x', tone: 'encouragement', message: 'x' };
    getAdviceMock.mockResolvedValue(advice);

    const res = await request(createApp()).post('/api/advice').send(VALID_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(advice);
  });

  it('returns 400 without calling Gemini when a required field is missing', async () => {
    const { income: _income, ...invalidPayload } = VALID_PAYLOAD;

    const res = await request(createApp()).post('/api/advice').send(invalidPayload);

    expect(res.status).toBe(400);
    expect(getAdviceMock).not.toHaveBeenCalled();
  });

  it('returns 502 with a generic message (never the raw error) when the service throws', async () => {
    getAdviceMock.mockRejectedValue(new Error('leaked-internal-detail'));

    const res = await request(createApp()).post('/api/advice').send(VALID_PAYLOAD);

    expect(res.status).toBe(502);
    expect(res.body.error).not.toMatch(/leaked-internal-detail/);
  });
});
