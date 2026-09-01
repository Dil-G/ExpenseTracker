try {
  process.loadEnvFile('.env');
} catch {
  // .env is optional (e.g. env vars supplied by the host instead) - safe to ignore if missing
}

import express from 'express';
import type { Request, Response } from 'express';
import { GeminiAdviceError, getAdvice } from './geminiAdviceService';
import type { AdviceRequestPayload } from '../src/core/types';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validatePayload(body: unknown): body is AdviceRequestPayload {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;

  if (
    !isFiniteNumber(b.income) ||
    !isFiniteNumber(b.fixedExpensesTotal) ||
    !isFiniteNumber(b.targetAmount) ||
    typeof b.targetDate !== 'string' ||
    !isFiniteNumber(b.requiredMonthlyPace)
  ) {
    return false;
  }
  if (typeof b.currency !== 'string' || b.currency.length === 0) return false;

  const feasibility = b.feasibility as Record<string, unknown> | undefined;
  if (
    !feasibility ||
    typeof feasibility.feasible !== 'boolean' ||
    !isFiniteNumber(feasibility.shortfall) ||
    !isFiniteNumber(feasibility.largestFeasibleGoal) ||
    !isFiniteNumber(feasibility.discretionaryBudget)
  ) {
    return false;
  }

  // categorySpend is an open map (CR2: user-defined categories) - just check it's a
  // plain object of finite numbers, not a fixed key set.
  const categorySpend = b.categorySpend as Record<string, unknown> | undefined;
  if (!categorySpend || typeof categorySpend !== 'object') return false;
  for (const value of Object.values(categorySpend)) {
    if (!isFiniteNumber(value)) return false;
  }

  const progress = b.progress as Record<string, unknown> | undefined;
  if (!progress || typeof progress.hasGoal !== 'boolean' || !isFiniteNumber(progress.totalSavedSoFar)) {
    return false;
  }

  return true;
}

export function createApp() {
  const app = express();
  app.use(express.json());

  app.post('/api/advice', async (req: Request, res: Response) => {
    if (!validatePayload(req.body)) {
      res.status(400).json({ error: 'Invalid advice request payload' });
      return;
    }

    try {
      const advice = await getAdvice(req.body);
      res.status(200).json(advice);
    } catch (error) {
      if (error instanceof GeminiAdviceError) {
        console.error('[GeminiAdviceService]', error.message);
      } else {
        console.error('[GeminiAdviceService] unexpected error', error);
      }
      res.status(502).json({ error: 'Advice temporarily unavailable' });
    }
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT) || 3001;
  createApp().listen(port, '127.0.0.1', () => {
    console.log(`Rollover advice proxy listening on http://127.0.0.1:${port}`);
  });
}
