/** Local-date helpers. All comparisons are date-only (midnight local), never UTC, to
 * match "device's local date" semantics from requirements.md and avoid off-by-one
 * bugs from timezone/UTC conversion. */

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

/** Clamps a day-of-month to the last valid day of the given month (e.g. 30 -> 28 in Feb). */
export function clampDayToMonth(year: number, monthIndex0: number, day: number): number {
  return Math.min(day, daysInMonth(year, monthIndex0));
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function daysBetween(a: Date, b: Date): number {
  const A = startOfDay(a).getTime();
  const B = startOfDay(b).getTime();
  return Math.round((B - A) / 86_400_000);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
