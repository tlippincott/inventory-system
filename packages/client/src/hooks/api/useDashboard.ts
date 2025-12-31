import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/dashboard';

/**
 * Query keys for dashboard
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

/**
 * Get dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const result = await dashboardApi.getStats();
      return result.data;
    },
    staleTime: 1000 * 60, // Consider stale after 1 minute
  });
}
