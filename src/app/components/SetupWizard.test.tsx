import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../state/AppProvider';
import { SetupWizard } from './SetupWizard';

describe('SetupWizard - category weights step (Finish Setup gating)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  async function goToStep3(user: ReturnType<typeof userEvent.setup>) {
    render(
      <AppProvider>
        <SetupWizard />
      </AppProvider>,
    );

    // First run: no PlanConfig yet, wizard opens automatically.
    await waitFor(() => expect(screen.getByTestId('setup-wizard-step1-income-input')).toBeInTheDocument());
    await user.type(screen.getByTestId('setup-wizard-step1-income-input'), '3000');
    await user.type(screen.getByTestId('setup-wizard-step1-goal-input'), '500');
    await user.clear(screen.getByTestId('setup-wizard-step1-cycle-day-input'));
    await user.type(screen.getByTestId('setup-wizard-step1-cycle-day-input'), '1');
    await user.type(screen.getByTestId('setup-wizard-step1-currency-input'), 'USD');
    await user.click(screen.getByTestId('setup-wizard-step1-next-button'));

    await user.click(screen.getByTestId('setup-wizard-step2-next-button'));
  }

  it('starts at 100% (equal default weights) with Finish Setup enabled', async () => {
    const user = userEvent.setup();
    await goToStep3(user);

    expect(screen.getByTestId('setup-wizard-step3-weight-sum')).toHaveTextContent('100%');
    expect(screen.getByTestId('setup-wizard-step3-finish-button')).toBeEnabled();
  });

  it('disables Finish Setup once weights no longer sum to 100', async () => {
    const user = userEvent.setup();
    await goToStep3(user);

    const foodInput = screen.getByTestId('setup-wizard-step3-weight-food-input');
    await user.clear(foodInput);
    await user.type(foodInput, '40');

    expect(screen.getByTestId('setup-wizard-step3-weight-sum')).toHaveTextContent('115%');
    expect(screen.getByTestId('setup-wizard-step3-finish-button')).toBeDisabled();
  });
});
