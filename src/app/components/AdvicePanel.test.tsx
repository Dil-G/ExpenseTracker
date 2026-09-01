import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AppProvider } from '../state/AppProvider';
import { AdvicePanel } from './AdvicePanel';
import { LocalStorageAdapter } from '../../core/storage/localStorageAdapter';
import type { PlanConfig } from '../../core/types';

const CONFIG: PlanConfig = {
  monthlyIncome: 3000,
  cycleStartDay: 1,
  currency: 'USD',
};

describe('AdvicePanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
    new LocalStorageAdapter().setPlanConfig(CONFIG);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down')),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('surfaces an error state with a Retry button when the advice request fails, without crashing the rest of the app', async () => {
    render(
      <AppProvider>
        <AdvicePanel />
      </AppProvider>,
    );

    // The automatic weekly-check fires on load (no lastAdviceFetchAt yet) and fails.
    await waitFor(() => expect(screen.getByTestId('advice-error-message')).toBeInTheDocument(), { timeout: 3000 });
    expect(screen.getByTestId('advice-retry-button')).toBeInTheDocument();
  });
});
