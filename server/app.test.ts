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
  targetAmount: 6000,
  targetDate: '2027-01-01',
  requiredMonthlyPace: 500,
  currency: 'USD',
  feasibility: { feasible: true, discretionaryBudget: 1400, shortfall: 0, largestFeasibleGoal: 1900 },
  categorySpend: { food: 100, transport: 50, entertainment: 0, other: 20 },
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
