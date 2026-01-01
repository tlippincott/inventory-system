import { z } from 'zod';

// Project schemas
export const createProjectSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  name: z.string().min(1, 'Project name is required').max(255, 'Project name too long'),
  description: z.string().optional(),
  defaultHourlyRateCents: z.number().int().min(0, 'Hourly rate must be non-negative').optional().default(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color (use format #RRGGBB)').optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export const projectQuerySchema = z.object({
  clientId: z.string().uuid('Invalid client ID').optional(),
  isActive: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// Time Session schemas
export const startTimeSessionSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  taskDescription: z.string().optional().default(''),
  notes: z.string().optional(),
  isBillable: z.boolean().optional().default(true),
});

export const updateTimeSessionSchema = z.object({
  taskDescription: z.string().min(1, 'Task description is required').optional(),
  notes: z.string().optional(),
  isBillable: z.boolean().optional(),
  hourlyRateCents: z.number().int().min(0, 'Hourly rate must be non-negative').optional(),
  durationSeconds: z.number().int().min(1, 'Duration must be positive').optional(),
});

export const bulkUpdateSessionsSchema = z.object({
  sessionIds: z.array(z.string().uuid('Invalid session ID')).min(1, 'At least one session required'),
  isBillable: z.boolean().optional(),
  hourlyRateCents: z.number().int().min(0, 'Hourly rate must be non-negative').optional(),
});

export const convertSessionsToInvoiceSchema = z.object({
  sessionIds: z.array(z.string().uuid('Invalid session ID')).min(1, 'At least one session required'),
  clientId: z.string().uuid('Invalid client ID'),
  groupByProject: z.boolean().default(true),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  taxRate: z.number().min(0, 'Tax rate must be non-negative').max(100, 'Tax rate cannot exceed 100%').optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export const timeSessionQuerySchema = z.object({
  clientId: z.string().uuid('Invalid client ID').optional(),
  projectId: z.string().uuid('Invalid project ID').optional(),
  status: z.enum(['running', 'paused', 'stopped']).optional(),
  isBillable: z.coerce.boolean().optional(),
  isBilled: z.coerce.boolean().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  sortBy: z.enum(['start_time', 'duration', 'amount']).optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});
