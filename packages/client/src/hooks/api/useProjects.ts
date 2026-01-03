import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/services/projects';
import type {
  CreateProjectDTO,
  UpdateProjectDTO,
} from '@invoice-system/shared';
import type { ProjectFilters } from '@/types';

/**
 * Query keys for projects
 */
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: ProjectFilters = {}) =>
    [...projectKeys.lists(), filters] as const,
  activeWithUnbilled: () =>
    [...projectKeys.all, 'activeWithUnbilled'] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  unbilledStats: (id: string) =>
    [...projectKeys.all, 'unbilledStats', id] as const,
  timeSessions: (id: string, params?: { status?: string }) =>
    [...projectKeys.all, 'timeSessions', id, params] as const,
};

/**
 * Get all projects with optional filters
 */
export function useProjects(params?: ProjectFilters) {
  return useQuery({
    queryKey: projectKeys.list(params || {}),
    queryFn: async () => {
      const result = await projectsApi.getAll(params);
      return result.data;
    },
    enabled: true,
  });
}

/**
 * Get single project by ID
 */
export function useProject(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const result = await projectsApi.getById(id);
      return result.data;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Get active projects with unbilled time (for dashboard)
 */
export function useActiveProjectsWithUnbilled() {
  return useQuery({
    queryKey: projectKeys.activeWithUnbilled(),
    queryFn: async () => {
      const result = await projectsApi.getActiveWithUnbilledTime();
      return result.data;
    },
  });
}

/**
 * Get unbilled stats for a project
 */
export function useProjectUnbilledStats(id: string) {
  return useQuery({
    queryKey: projectKeys.unbilledStats(id),
    queryFn: async () => {
      const result = await projectsApi.getUnbilledStats(id);
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Get time sessions for a project
 */
export function useProjectTimeSessions(
  id: string,
  params?: { status?: string }
) {
  return useQuery({
    queryKey: projectKeys.timeSessions(id, params),
    queryFn: async () => {
      const result = await projectsApi.getTimeSessions(id, params);
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Create new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectDTO) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Update project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDTO }) =>
      projectsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Delete project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Toggle project active status
 */
export function useToggleProjectActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.toggleActive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Archive project
 */
export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.archive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Unarchive project
 */
export function useUnarchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.unarchive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
