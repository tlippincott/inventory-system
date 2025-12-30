import { api } from './api';
import type { ApiResponse, SessionFilters } from '@/types';

// Import types from shared package
import type {
  TimeSession,
  StartTimeSessionDTO,
  UpdateTimeSessionDTO,
} from '@invoice-system/shared';

export const timeSessionsApi = {
  /**
   * Timer controls
   */
  start: async (data: StartTimeSessionDTO) => {
    const response = await api.post<ApiResponse<TimeSession>>(
      '/time-sessions/start',
      data
    );
    return response.data;
  },

  pause: async (id: string) => {
    const response = await api.patch<ApiResponse<TimeSession>>(
      `/time-sessions/${id}/pause`
    );
    return response.data;
  },

  resume: async (id: string) => {
    const response = await api.patch<ApiResponse<TimeSession>>(
      `/time-sessions/${id}/resume`
    );
    return response.data;
  },

  stop: async (id: string) => {
    const response = await api.patch<ApiResponse<TimeSession>>(
      `/time-sessions/${id}/stop`
    );
    return response.data;
  },

  /**
   * CRUD operations
   */
  getAll: async (params?: SessionFilters) => {
    const response = await api.get<ApiResponse<TimeSession[]>>(
      '/time-sessions',
      { params }
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<TimeSession>>(
      `/time-sessions/${id}`
    );
    return response.data;
  },

  getActive: async () => {
    const response = await api.get<ApiResponse<TimeSession | null>>(
      '/time-sessions/active'
    );
    return response.data;
  },

  getUnbilled: async (params?: {
    clientId?: string;
    projectId?: string;
  }) => {
    const response = await api.get<ApiResponse<TimeSession[]>>(
      '/time-sessions/unbilled',
      { params }
    );
    return response.data;
  },

  getBillingSummary: async (params?: {
    fromDate?: string;
    toDate?: string;
  }) => {
    const response = await api.get<
      ApiResponse<{
        totalHours: number;
        totalAmount: number;
        sessionCount: number;
      }>
    >('/time-sessions/billing-summary', { params });
    return response.data;
  },

  update: async (id: string, data: UpdateTimeSessionDTO) => {
    const response = await api.put<ApiResponse<TimeSession>>(
      `/time-sessions/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(
      `/time-sessions/${id}`
    );
    return response.data;
  },

  bulkUpdate: async (data: {
    sessionIds: string[];
    updates: Partial<UpdateTimeSessionDTO>;
  }) => {
    const response = await api.patch<ApiResponse<TimeSession[]>>(
      '/time-sessions/bulk-update',
      data
    );
    return response.data;
  },
};
