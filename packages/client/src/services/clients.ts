import { api } from './api';
import type { ApiResponse, ClientFilters } from '@/types';

// Import types from shared package
import type {
  Client,
  CreateClientDTO,
  UpdateClientDTO,
} from '@invoice-system/shared';

export const clientsApi = {
  /**
   * CRUD operations
   */
  getAll: async (params?: ClientFilters) => {
    const response = await api.get<ApiResponse<Client[]>>('/clients', {
      params,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Client>>(`/clients/${id}`);
    return response.data;
  },

  create: async (data: CreateClientDTO) => {
    const response = await api.post<ApiResponse<Client>>('/clients', data);
    return response.data;
  },

  update: async (id: string, data: UpdateClientDTO) => {
    const response = await api.put<ApiResponse<Client>>(
      `/clients/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/clients/${id}`);
    return response.data;
  },

  /**
   * Client-specific operations
   */
  toggleActive: async (id: string) => {
    const response = await api.patch<ApiResponse<Client>>(
      `/clients/${id}/toggle-active`
    );
    return response.data;
  },

  getStatistics: async (id: string) => {
    const response = await api.get<
      ApiResponse<{
        totalInvoices: number;
        totalRevenue: number;
        outstandingBalance: number;
        paidInvoices: number;
        overdueInvoices: number;
      }>
    >(`/clients/${id}/statistics`);
    return response.data;
  },

  getInvoices: async (id: string, params?: { status?: string }) => {
    const response = await api.get<ApiResponse<any[]>>(
      `/clients/${id}/invoices`,
      { params }
    );
    return response.data;
  },

  getProjects: async (id: string, params?: { isActive?: boolean }) => {
    const response = await api.get<ApiResponse<any[]>>(
      `/clients/${id}/projects`,
      { params }
    );
    return response.data;
  },
};
