import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/services/invoices';
import { timeSessionKeys } from './useTimeSessions';
import type {
  Invoice,
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  InvoiceStatus,
  CreateInvoiceItemDTO,
  UpdateInvoiceItemDTO,
} from '@invoice-system/shared';
import type { InvoiceFilters } from '@/types';

/**
 * Query keys for invoices
 */
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: InvoiceFilters = {}) =>
    [...invoiceKeys.lists(), filters] as const,
  detail: (id: string) => [...invoiceKeys.all, 'detail', id] as const,
};

/**
 * Get all invoices with optional filters
 */
export function useInvoices(params?: InvoiceFilters) {
  return useQuery({
    queryKey: invoiceKeys.list(params || {}),
    queryFn: async () => {
      const result = await invoicesApi.getAll(params);
      return result.data;
    },
  });
}

/**
 * Get single invoice by ID with items and client
 */
export function useInvoice(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      const result = await invoicesApi.getById(id);
      return result.data;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Create invoice manually
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceDTO) => invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Create invoice from time sessions (KILLER FEATURE)
 */
export function useCreateInvoiceFromSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      sessionIds: string[];
      clientId: string;
      groupByProject?: boolean;
      issueDate: Date | string;
      dueDate: Date | string;
      taxRate?: number;
      notes?: string;
      terms?: string;
    }) => invoicesApi.createFromSessions(data),
    onSuccess: () => {
      // Invalidate invoice lists
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      // Invalidate unbilled sessions (they're now billed)
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.unbilled() });
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Update invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceDTO }) =>
      invoicesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/**
 * Delete invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      // Deleting invoice unbills the sessions
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.unbilled() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Update invoice status
 */
export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) =>
      invoicesApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: invoiceKeys.detail(id) });

      // Snapshot previous value
      const previous = queryClient.getQueryData<Invoice>(
        invoiceKeys.detail(id)
      );

      // Optimistically update
      if (previous) {
        queryClient.setQueryData<Invoice>(invoiceKeys.detail(id), {
          ...previous,
          status,
        });
      }

      return { previous };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          invoiceKeys.detail(variables.id),
          context.previous
        );
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      // If status changed to 'paid', update dashboard revenue stats
      if (variables.status === 'paid') {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    },
  });
}

/**
 * Generate or regenerate PDF for invoice
 */
export function useGeneratePDF() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoicesApi.generatePDF(id),
    onSuccess: (result) => {
      // Update invoice detail to reflect new pdfPath
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(result.data.id),
      });
    },
  });
}

/**
 * Add line item to invoice
 */
export function useAddLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: string;
      data: CreateInvoiceItemDTO;
    }) => invoicesApi.addLineItem(invoiceId, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(result.data.id),
      });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/**
 * Update line item in invoice
 */
export function useUpdateLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      itemId,
      data,
    }: {
      invoiceId: string;
      itemId: string;
      data: UpdateInvoiceItemDTO;
    }) => invoicesApi.updateLineItem(invoiceId, itemId, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(result.data.id),
      });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/**
 * Delete line item from invoice
 */
export function useDeleteLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      itemId,
    }: {
      invoiceId: string;
      itemId: string;
    }) => invoicesApi.deleteLineItem(invoiceId, itemId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(result.data.id),
      });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      // Deleting item unbills associated sessions
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.unbilled() });
    },
  });
}
