export function AddExpenseButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="add-expense-button" onClick={onClick} data-testid="add-expense-button" aria-label="Add expense">
      +
    </button>
  );
}
