import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/services/clients';
import type {
  CreateClientDTO,
  UpdateClientDTO,
} from '@invoice-system/shared';
import type { ClientFilters } from '@/types';

/**
 * Query keys for clients
 */
export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters: ClientFilters = {}) =>
    [...clientKeys.lists(), filters] as const,
  detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
  statistics: (id: string) => [...clientKeys.all, 'statistics', id] as const,
  invoices: (id: string, params?: { status?: string }) =>
    [...clientKeys.all, 'invoices', id, params] as const,
  projects: (id: string, params?: { isActive?: boolean }) =>
    [...clientKeys.all, 'projects', id, params] as const,
};

/**
 * Get all clients with optional filters
 */
export function useClients(params?: ClientFilters) {
  return useQuery({
    queryKey: clientKeys.list(params || {}),
    queryFn: async () => {
      const result = await clientsApi.getAll(params);
      return result.data;
    },
  });
}

/**
 * Get single client by ID
 */
export function useClient(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: async () => {
      const result = await clientsApi.getById(id);
      return result.data;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Get client statistics
 */
export function useClientStatistics(id: string) {
  return useQuery({
    queryKey: clientKeys.statistics(id),
    queryFn: async () => {
      const result = await clientsApi.getStatistics(id);
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Get client invoices
 */
export function useClientInvoices(id: string, params?: { status?: string }) {
  return useQuery({
    queryKey: clientKeys.invoices(id, params),
    queryFn: async () => {
      const result = await clientsApi.getInvoices(id, params);
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Get client projects
 */
export function useClientProjects(
  id: string,
  params?: { isActive?: boolean }
) {
  return useQuery({
    queryKey: clientKeys.projects(id, params),
    queryFn: async () => {
      const result = await clientsApi.getProjects(id, params);
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Create new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientDTO) => clientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

/**
 * Update client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDTO }) =>
      clientsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

/**
 * Delete client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

/**
 * Toggle client active status
 */
export function useToggleClientActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientsApi.toggleActive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}
