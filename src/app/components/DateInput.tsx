import type { InputHTMLAttributes } from 'react';

/** A date `<input>` that proactively opens the native calendar picker on focus/click
 * (via `showPicker()`, supported in Chromium/Edge) instead of leaving the user to type
 * digits into the MM/DD/YYYY segments. There's no way to fully disable keyboard entry
 * on a native date input while keeping it a real date input (readonly blocks the picker
 * entirely in Chrome), so typing still works as a fallback on browsers without
 * `showPicker` - this nudges toward the picker without breaking the field elsewhere. */
export function DateInput(props: InputHTMLAttributes<HTMLInputElement>) {
  function openPicker(e: React.SyntheticEvent<HTMLInputElement>) {
    const target = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
    try {
      target.showPicker?.();
    } catch {
      // showPicker can throw (e.g. not called from a user gesture in some browsers) -
      // typing remains available as a fallback, so just ignore it.
    }
  }

  return (
    <input
      type="date"
      {...props}
      onFocus={(e) => {
        props.onFocus?.(e);
        openPicker(e);
      }}
      onClick={(e) => {
        props.onClick?.(e);
        openPicker(e);
      }}
    />
  );
}
