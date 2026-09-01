import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddExpenseSheet } from './AddExpenseSheet';

describe('AddExpenseSheet (two-tap add flow)', () => {
  it('saves with pre-filled defaults (today, defaultCategory) after only typing an amount', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<AddExpenseSheet isOpen defaultCategory="transport" onSave={onSave} onClose={vi.fn()} />);

    // Tap 1 (opening the sheet) already happened via isOpen=true from the parent.
    await user.type(screen.getByTestId('add-expense-amount-input'), '12.5');
    // Tap 2: Save.
    await user.click(screen.getByTestId('add-expense-save-button'));

    expect(onSave).toHaveBeenCalledTimes(1);
    const call = onSave.mock.calls[0][0];
    expect(call.amount).toBe(12.5);
    expect(call.category).toBe('transport');
    expect(call.date).toBe(new Date().toISOString().slice(0, 10));
  });

  it('keeps Save disabled until a positive amount is entered', () => {
    render(<AddExpenseSheet isOpen defaultCategory="food" onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('add-expense-save-button')).toBeDisabled();
  });

  it('renders nothing when isOpen is false', () => {
    render(<AddExpenseSheet isOpen={false} defaultCategory="food" onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByTestId('add-expense-sheet')).not.toBeInTheDocument();
  });
});
