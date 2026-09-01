import type { ReactNode } from 'react';
import { CloseIcon } from './icons';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Centered modal reusing the app's existing wizard-overlay/wizard-card pattern
 * (already established by FirstRunWizard). Clicking the backdrop or the close icon
 * dismisses without saving - the form inside owns its own Save action. */
export function EditModal({ title, onClose, children }: Props) {
  return (
    <div className="wizard-overlay" onClick={onClose}>
      <div className="wizard-card" onClick={(e) => e.stopPropagation()} data-testid="edit-modal">
        <button type="button" className="wizard-close icon-button" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
