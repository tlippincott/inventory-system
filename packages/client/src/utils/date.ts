import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

/**
 * Format session date for display
 * Shows "Today", "Yesterday", or formatted date
 * @param date - Date object or ISO string
 * @returns Formatted date string
 */
export function formatSessionDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(d)) {
    return 'Today';
  }

  if (isYesterday(d)) {
    return 'Yesterday';
  }

  return format(d, 'MMM d, yyyy');
}

/**
 * Format date and time for display
 * @param date - Date object or ISO string
 * @returns Formatted date and time string (e.g., "Mar 15, 2024 at 2:30 PM")
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

/**
 * Format time only
 * @param date - Date object or ISO string
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
}

/**
 * Format date relative to now
 * @param date - Date object or ISO string
 * @returns Relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param date - Date object or ISO string
 * @returns ISO date string for input value
 */
export function formatInputDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * Get start and end of today
 * @returns Object with start and end timestamps
 */
export function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfDay(now),
    end: endOfDay(now),
  };
}

/**
 * Get start and end of current week
 * @returns Object with start and end timestamps
 */
export function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now),
    end: endOfWeek(now),
  };
}

/**
 * Get start and end of current month
 * @returns Object with start and end timestamps
 */
export function getMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}
