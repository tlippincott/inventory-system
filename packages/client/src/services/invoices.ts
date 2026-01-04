import { api } from './api';
import type { ApiResponse, InvoiceFilters } from '@/types';

// Import types from shared package
import type {
  Invoice,
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  CreateInvoiceItemDTO,
  UpdateInvoiceItemDTO,
  InvoiceStatus,
} from '@invoice-system/shared';

export const invoicesApi = {
  /**
   * Core CRUD operations
   */
  getAll: async (params?: InvoiceFilters) => {
    const response = await api.get<ApiResponse<Invoice[]>>('/invoices', {
      params,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return response.data;
  },

  create: async (data: CreateInvoiceDTO) => {
    const response = await api.post<ApiResponse<Invoice>>('/invoices', data);
    return response.data;
  },

  update: async (id: string, data: UpdateInvoiceDTO) => {
    const response = await api.put<ApiResponse<Invoice>>(
      `/invoices/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/invoices/${id}`);
    return response.data;
  },

  /**
   * Special invoice creation from time sessions (KILLER FEATURE)
   */
  createFromSessions: async (data: {
    sessionIds: string[];
    clientId: string;
    groupByProject?: boolean;
    issueDate: Date | string;
    dueDate: Date | string;
    taxRate?: number;
    notes?: string;
    terms?: string;
  }) => {
    const response = await api.post<ApiResponse<Invoice>>(
      '/invoices/from-sessions',
      data
    );
    return response.data;
  },

  /**
   * Status management
   */
  updateStatus: async (id: string, status: InvoiceStatus) => {
    const response = await api.patch<ApiResponse<Invoice>>(
      `/invoices/${id}/status`,
      { status }
    );
    return response.data;
  },

  /**
   * PDF operations
   */
  generatePDF: async (id: string) => {
    const response = await api.post<ApiResponse<Invoice>>(
      `/invoices/${id}/generate-pdf`
    );
    return response.data;
  },

  downloadPDF: async (id: string) => {
    const response = await api.get<Blob>(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Line item management
   */
  addLineItem: async (invoiceId: string, data: CreateInvoiceItemDTO) => {
    const response = await api.post<ApiResponse<Invoice>>(
      `/invoices/${invoiceId}/items`,
      data
    );
    return response.data;
  },

  updateLineItem: async (
    invoiceId: string,
    itemId: string,
    data: UpdateInvoiceItemDTO
  ) => {
    const response = await api.put<ApiResponse<Invoice>>(
      `/invoices/${invoiceId}/items/${itemId}`,
      data
    );
    return response.data;
  },

  deleteLineItem: async (invoiceId: string, itemId: string) => {
    const response = await api.delete<ApiResponse<Invoice>>(
      `/invoices/${invoiceId}/items/${itemId}`
    );
    return response.data;
  },
};
