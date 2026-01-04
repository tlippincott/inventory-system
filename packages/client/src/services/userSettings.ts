import { api } from './api';
import type { ApiResponse } from '@/types';

// Import types from shared package
import type {
  UserSettings,
  UpdateUserSettingsDTO,
} from '@invoice-system/shared';

export const userSettingsApi = {
  /**
   * Get user settings
   */
  get: async () => {
    const response = await api.get<ApiResponse<UserSettings>>(
      '/user-settings'
    );
    return response.data;
  },

  /**
   * Update user settings
   */
  update: async (data: UpdateUserSettingsDTO) => {
    const response = await api.put<ApiResponse<UserSettings>>(
      '/user-settings',
      data
    );
    return response.data;
  },
};
