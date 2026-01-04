import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userSettingsApi } from '@/services/userSettings';
import type { UserSettings, UpdateUserSettingsDTO } from '@invoice-system/shared';

/**
 * Query keys for user settings
 */
export const userSettingsKeys = {
  all: ['userSettings'] as const,
  detail: () => [...userSettingsKeys.all, 'detail'] as const,
};

/**
 * Get user settings (including defaultTaxRate)
 */
export function useUserSettings() {
  return useQuery({
    queryKey: userSettingsKeys.detail(),
    queryFn: async () => {
      const result = await userSettingsApi.get();
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - settings don't change often
  });
}

/**
 * Update user settings
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserSettingsDTO) => userSettingsApi.update(data),
    onSuccess: (result) => {
      // Update cached settings
      queryClient.setQueryData<UserSettings>(
        userSettingsKeys.detail(),
        result.data
      );
    },
  });
}
