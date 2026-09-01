import { useAppState } from '../state/AppProvider';
import { formatMoney } from '../utils/formatMoney';
import { AlertIcon, SpinnerIcon } from './icons';

export function AdvicePanel() {
  const { advice, requestAdvice } = useAppState();

  return (
    <section data-testid="advice-panel">
      <h2>Advice</h2>

      {advice.status === 'idle' && (
        <>
          <p>Get personalised coaching on your plan, whenever you want it.</p>
          <button type="button" onClick={requestAdvice} data-testid="advice-get-button">
            Get Advice
          </button>
        </>
      )}

      {advice.status === 'loading' && (
        <p data-testid="advice-loading-spinner">
          <SpinnerIcon width={16} height={16} /> Loading advice...
        </p>
      )}

      {advice.status === 'error' && (
        <>
          <p data-testid="advice-error-message" role="alert" className="advice-tone-warning">
            <AlertIcon width={16} height={16} /> {advice.errorMessage ?? 'Advice is temporarily unavailable.'}
          </p>
          <button type="button" className="button-secondary" onClick={requestAdvice} data-testid="advice-retry-button">
            Retry
          </button>
        </>
      )}

      {advice.status === 'success' && advice.data && (
        <div data-testid="advice-content">
          <span data-testid="advice-source-tag">{advice.lastFetchKind === 'weekly' ? 'Weekly overview' : 'Manual'}</span>
          <p className={advice.data.tone === 'warning' ? 'advice-tone-warning' : 'advice-tone-encouragement'}>{advice.data.message}</p>
          <h3>How to reach your goal</h3>
          <p>{advice.data.howToReachGoal}</p>
          {advice.data.categoriesToTrim.length > 0 && (
            <>
              <h3>Categories to trim</h3>
              <ul>
                {advice.data.categoriesToTrim.map((c) => (
                  <li key={c.category}>
                    <span className="category-name">{c.category}</span>: ~<span className="num">{formatMoney(c.suggestedReductionAmount)}</span>.{' '}
                    {c.reason}
                  </li>
                ))}
              </ul>
            </>
          )}
          <h3>First step</h3>
          <p>{advice.data.firstStep}</p>
          <button type="button" onClick={requestAdvice} data-testid="advice-get-button">
            Refresh
          </button>
        </div>
      )}
    </section>
  );
}
