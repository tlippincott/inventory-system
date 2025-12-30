import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeSessionsApi } from '@/services/timeSessions';
import type {
  TimeSession,
  StartTimeSessionDTO,
  UpdateTimeSessionDTO,
} from '@invoice-system/shared';
import type { SessionFilters } from '@/types';

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
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: timeSessionKeys.active() });

      // Snapshot previous value
      const previous = queryClient.getQueryData<TimeSession | null>(
        timeSessionKeys.active()
      );

      // Optimistically update
      if (previous) {
        queryClient.setQueryData<TimeSession | null>(
          timeSessionKeys.active(),
          {
            ...previous,
            status: 'paused',
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
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.active() });
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: timeSessionKeys.active() });

      const previous = queryClient.getQueryData<TimeSession | null>(
        timeSessionKeys.active()
      );

      if (previous) {
        queryClient.setQueryData<TimeSession | null>(
          timeSessionKeys.active(),
          {
            ...previous,
            status: 'running',
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: timeSessionKeys.active() });
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
    },
  });
}
