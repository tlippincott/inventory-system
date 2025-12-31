/**
 * Format duration in seconds to HH:MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted time string (e.g., "02:34:15")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration in seconds to human-readable format
 * @param seconds - Duration in seconds
 * @param short - Use short format (e.g., "2h 34m" vs "2 hours 34 minutes")
 * @returns Human-readable time string
 */
export function formatDurationHuman(
  seconds: number,
  short = true
): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0 && minutes === 0) {
    return short ? '< 1m' : 'less than 1 minute';
  }

  if (hours === 0) {
    return short ? `${minutes}m` : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  if (short) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  const hourText = `${hours} hour${hours !== 1 ? 's' : ''}`;
  const minuteText =
    minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : '';

  return hourText + minuteText;
}

/**
 * Calculate duration in seconds between two timestamps
 * @param startTime - Start timestamp (Date or ISO string)
 * @param endTime - End timestamp (Date or ISO string, defaults to now)
 * @returns Duration in seconds
 */
export function calculateDuration(
  startTime: Date | string,
  endTime?: Date | string
): number {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();

  return Math.floor((end - start) / 1000);
}

/**
 * Convert hours to seconds
 * @param hours - Number of hours
 * @returns Seconds
 */
export function hoursToSeconds(hours: number): number {
  return Math.round(hours * 3600);
}

/**
 * Convert seconds to hours (decimal)
 * @param seconds - Number of seconds
 * @returns Hours as decimal
 */
export function secondsToHours(seconds: number): number {
  return seconds / 3600;
}

/**
 * Format date to readable string
 * @param date - Date to format
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time to readable string
 * @param date - Date to format
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
