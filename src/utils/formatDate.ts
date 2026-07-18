/** ISO date (YYYY-MM-DD) for <time datetime> attributes. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Human-readable date used everywhere a date is displayed. */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
