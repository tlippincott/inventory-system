import { api } from './api';
import type { ApiResponse, ProjectFilters } from '@/types';

// Import types from shared package
import type {
  Project,
  CreateProjectDTO,
  UpdateProjectDTO,
} from '@invoice-system/shared';

export const projectsApi = {
  /**
   * CRUD operations
   */
  getAll: async (params?: ProjectFilters) => {
    const response = await api.get<ApiResponse<Project[]>>('/projects', {
      params,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    return response.data;
  },

  create: async (data: CreateProjectDTO) => {
    const response = await api.post<ApiResponse<Project>>('/projects', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProjectDTO) => {
    const response = await api.put<ApiResponse<Project>>(
      `/projects/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<void>>(`/projects/${id}`);
    return response.data;
  },

  /**
   * Project-specific operations
   */
  toggleActive: async (id: string) => {
    const response = await api.patch<ApiResponse<Project>>(
      `/projects/${id}/toggle-active`
    );
    return response.data;
  },

  archive: async (id: string) => {
    const response = await api.patch<ApiResponse<Project>>(
      `/projects/${id}/archive`
    );
    return response.data;
  },

  unarchive: async (id: string) => {
    const response = await api.patch<ApiResponse<Project>>(
      `/projects/${id}/unarchive`
    );
    return response.data;
  },

  getUnbilledStats: async (id: string) => {
    const response = await api.get<
      ApiResponse<{
        unbilledHours: number;
        unbilledAmount: number;
        sessionCount: number;
      }>
    >(`/projects/${id}/unbilled-stats`);
    return response.data;
  },

  getActiveWithUnbilledTime: async () => {
    const response = await api.get<ApiResponse<Project[]>>(
      '/projects/active/unbilled'
    );
    return response.data;
  },

  getTimeSessions: async (id: string, params?: { status?: string }) => {
    const response = await api.get<ApiResponse<any[]>>(
      `/projects/${id}/time-sessions`,
      { params }
    );
    return response.data;
  },
};
