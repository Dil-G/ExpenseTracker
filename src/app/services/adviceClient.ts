import type { AdviceRequestPayload, AdviceResponse } from '../../core/types';

export class AdviceClientError extends Error {}

export async function fetchAdvice(payload: AdviceRequestPayload): Promise<AdviceResponse> {
  let res: Response;
  try {
    res = await fetch('/api/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AdviceClientError('Could not reach the advice service. Check your connection and try again.');
  }

  if (!res.ok) {
    throw new AdviceClientError('Advice is temporarily unavailable. Please try again later.');
  }

  return (await res.json()) as AdviceResponse;
}
