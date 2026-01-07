import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeSessionsApi } from '@/services/timeSessions';
import type {
  TimeSession,
  StartTimeSessionDTO,
  UpdateTimeSessionDTO,
} from '@invoice-system/shared';
import type { SessionFilters } from '@/types';
import { dashboardKeys } from './useDashboard';

/**
 * Query keys for time sessions
 */
export const timeSessionKeys = {
  all: ['timeSessions'] as const,
  lists: () => [...timeSessionKeys.all, 'list'] as const,
  list: (filters: SessionFilters = {}) =>
    [...timeSessionKeys.lists(), filters] as const,
  active: () => [...timeSessionKeys.all, 'active'] as const,
  unbilled: (filters?: { clientId?: string; projectId?: string }) =>
    [...timeSessionKeys.all, 'unbilled', filters] as const,
  billingSummary: (filters?: { fromDate?: string; toDate?: string }) =>
    [...timeSessionKeys.all, 'billingSummary', filters] as const,
  detail: (id: string) => [...timeSessionKeys.all, 'detail', id] as const,
};

/**
 * Get all time sessions with optional filters
 */
export function useTimeSessions(params?: SessionFilters) {
  return useQuery({
    queryKey: timeSessionKeys.list(params || {}),
    queryFn: async () => {
      const result = await timeSessionsApi.getAll(params);
      return result.data;
    },
  });
}

/**
 * Get single time session by ID
 */
export function useTimeSession(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: timeSessionKeys.detail(id),
    queryFn: async () => {
      const result = await timeSessionsApi.getById(id);
      return result.data;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Get currently active session (polls every 1 second for real-time updates)
 */
export function useActiveSession() {
  return useQuery({
    queryKey: timeSessionKeys.active(),
    queryFn: async () => {
      const result = await timeSessionsApi.getActive();
      return result.data;
    },
    refetchInterval: 1000, // Poll every second for real-time timer
    staleTime: 0, // Always consider stale to ensure fresh data
  });
}

/**
 * Get the most recent time session with an active project
 * (for the "Continue Timer" feature on Dashboard)
 */
export function useMostRecentActiveProjectSession() {
  return useQuery({
    queryKey: [...timeSessionKeys.lists(), 'mostRecentActive'],
    queryFn: async () => {
      // Fetch recent stopped sessions, sorted by start time descending
      const result = await timeSessionsApi.getAll({
        status: 'stopped',
        sortBy: 'start_time',
        order: 'desc',
        limit: 20, // Get last 20 to find one with active project
      });

      // Find the first session where the project is active
      const sessionWithActiveProject = result.data.find(
        (session) => session.project?.isActive === true
      );

      return sessionWithActiveProject || null;
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}

/**
 * Get unbilled time sessions
 */
export function useUnbilledSessions(params?: {
  clientId?: string;
  projectId?: string;
}) {
  return useQuery({
    queryKey: timeSessionKeys.unbilled(params),
    queryFn: async () => {
      const result = await timeSessionsApi.getUnbilled(params);
      return result.data;
    },
  });
}

/**
 * Get billing summary stats
 */
export function useBillingSummary(params?: {
  fromDate?: string;
  toDate?: string;
}) {
  return useQuery({
    queryKey: timeSessionKeys.billingSummary(params),
    queryFn: async () => {
      const result = await timeSessionsApi.getBillingSummary(params);
      return result.data;
    },
  });
}

/**
 * Start new time session
 */
export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StartTimeSessionDTO) => timeSessionsApi.start(data),
    onSuccess: () => {
      // Invalidate active session and all lists
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.active() });
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.lists() });
    },
  });
}

/**
 * Pause running session
 */
export function usePauseSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => timeSessionsApi.pause(id),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: timeSessionKeys.active() });

      // Snapshot previous value
      const previous = queryClient.getQueryData<TimeSession | null>(
        timeSessionKeys.active()
      );

      // Optimistically update
      if (previous) {
        // Calculate current duration to match server calculation
        const accumulatedSeconds = previous.durationSeconds || 0;
        const startTime = new Date(previous.startTime).getTime();
        const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
        const totalDuration = accumulatedSeconds + Math.max(0, currentElapsed);

        queryClient.setQueryData<TimeSession | null>(
          timeSessionKeys.active(),
          {
            ...previous,
            status: 'paused',
            durationSeconds: totalDuration,
          }
        );
      }

      return { previous };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previous !== undefined) {
        queryClient.setQueryData(timeSessionKeys.active(), context.previous);
      }
    },
    onSuccess: () => {
      // Don't invalidate immediately - let the polling interval (1s) pick up the change
      // This prevents the flash/jiggle from an immediate refetch
    },
  });
}

/**
 * Resume paused session
 */
export function useResumeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => timeSessionsApi.resume(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: timeSessionKeys.active() });

      const previous = queryClient.getQueryData<TimeSession | null>(
        timeSessionKeys.active()
      );

      if (previous) {
        // Optimistically update status and set new start time
        queryClient.setQueryData<TimeSession | null>(
          timeSessionKeys.active(),
          {
            ...previous,
            status: 'running',
            startTime: new Date().toISOString(),
          }
        );
      }

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(timeSessionKeys.active(), context.previous);
      }
    },
    onSuccess: () => {
      // Don't invalidate immediately - let the polling interval (1s) pick up the change
      // This prevents the flash/jiggle from an immediate refetch
    },
  });
}

/**
 * Stop running/paused session
 */
export function useStopSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => timeSessionsApi.stop(id),
    onSuccess: () => {
      // Clear active session and invalidate lists
      queryClient.setQueryData(timeSessionKeys.active(), null);
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.unbilled() });
      // Invalidate dashboard to update unbilled time
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}

/**
 * Update time session
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTimeSessionDTO }) =>
      timeSessionsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: timeSessionKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.active() });
      // Invalidate dashboard to update unbilled time
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}

/**
 * Delete time session
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => timeSessionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.unbilled() });
      // Invalidate dashboard to update unbilled time
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}

/**
 * Bulk update sessions
 */
export function useBulkUpdateSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      sessionIds: string[];
      updates: Partial<UpdateTimeSessionDTO>;
    }) => timeSessionsApi.bulkUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.unbilled() });
      // Invalidate dashboard to update unbilled time
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}
