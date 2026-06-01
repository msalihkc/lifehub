/**
 * Centralized Date Utilities for LifeHub to prevent timezone shifts.
 * Standardizes date representations strictly on the user's local clock.
 */

/**
 * Returns the local date formatted as 'YYYY-MM-DD' from a given Date object.
 * Always matches the user's local calendar day.
 */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a local 'YYYY-MM-DD' string representing a day `daysAgo` in the past.
 */
export function getPastLocalDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return toLocalDateString(d);
}

/**
 * Safely parses a 'YYYY-MM-DD' local date string into a local Date object.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Construct using the local time constructor to avoid UTC shifting
  return new Date(year, month - 1, day);
}

/**
 * Formats a local date string (YYYY-MM-DD) into a human readable long format.
 * E.g., '2026-06-01' -> 'Monday, June 1, 2026'
 */
export function formatLocalLongDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
