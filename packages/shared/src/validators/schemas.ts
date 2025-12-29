import { z } from 'zod';

// Client schemas
export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  companyName: z.string().max(255).optional(),

  billingAddressLine1: z.string().max(255).optional(),
  billingAddressLine2: z.string().max(255).optional(),
  billingCity: z.string().max(100).optional(),
  billingState: z.string().max(100).optional(),
  billingPostalCode: z.string().max(20).optional(),
  billingCountry: z.string().max(100).optional(),

  defaultPaymentTerms: z.number().int().min(0).max(365).optional(),
  defaultCurrency: z.string().length(3).optional(),

  taxId: z.string().max(100).optional(),
  notes: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Invoice Item schemas
export const createInvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPriceCents: z.number().int().min(0, 'Price must be non-negative'),
});

export const updateInvoiceItemSchema = createInvoiceItemSchema.partial();

// Invoice schemas
export const createInvoiceSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  taxRate: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(createInvoiceItemSchema).min(1, 'At least one item is required'),
});

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
});

// Payment schemas
export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  amountCents: z.number().int().positive('Amount must be positive'),
  paymentDate: z.coerce.date(),
  paymentMethod: z.enum(['bank_transfer', 'check', 'cash', 'credit_card', 'other']),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().optional(),
});

export const updatePaymentSchema = createPaymentSchema.partial();

// Settings schemas
export const updateUserSettingsSchema = z.object({
  businessName: z.string().min(1).max(255).optional(),
  ownerName: z.string().max(255).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),

  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),

  taxId: z.string().max(100).optional(),

  defaultPaymentTerms: z.number().int().min(0).max(365).optional(),
  defaultCurrency: z.string().length(3).optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),

  invoicePrefix: z.string().max(20).optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const invoiceQuerySchema = paginationSchema.extend({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  clientId: z.string().uuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z.enum(['date', 'amount', 'due_date']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// Time tracking schemas (re-export from separate file)
export * from './timeTracking.js';
