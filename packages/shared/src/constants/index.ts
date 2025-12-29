// Invoice statuses
export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;

// Payment methods
export const PAYMENT_METHODS = [
  'bank_transfer',
  'check',
  'cash',
  'credit_card',
  'other',
] as const;

// Currencies (can be extended)
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const;

export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_PAYMENT_TERMS = 30; // days
export const DEFAULT_TAX_RATE = 0; // percentage
export const DEFAULT_INVOICE_PREFIX = 'INV';

// Money conversion helpers
export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function formatCurrency(cents: number, currency: string = 'USD'): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
}
