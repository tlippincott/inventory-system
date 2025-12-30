/**
 * Format cents to display as dollars with currency symbol
 * @param cents - Amount in cents (integer)
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string (e.g., "$12.50")
 */
export function formatCents(cents: number, currency = 'USD'): string {
  const dollars = cents / 100;

  if (currency === 'USD') {
    return `$${dollars.toFixed(2)}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
}

/**
 * Parse dollar string to cents
 * @param dollars - Dollar amount as string (e.g., "12.50" or "$12.50")
 * @returns Amount in cents (integer)
 */
export function parseDollars(dollars: string): number {
  // Remove currency symbols and whitespace
  const cleaned = dollars.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    return 0;
  }

  // Round to avoid floating point issues
  return Math.round(parsed * 100);
}

/**
 * Format cents for input fields (without currency symbol)
 * @param cents - Amount in cents (integer)
 * @returns Dollar amount as string (e.g., "12.50")
 */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
