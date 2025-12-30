/**
 * UI-specific type definitions
 */

/**
 * Loading state for async operations
 */
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Local timer state (for UI display)
 */
export interface TimerState {
  elapsedSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  lastSyncTime: number;
}

/**
 * Dialog state types
 */
export type DialogMode = 'create' | 'edit' | 'delete' | null;

export interface DialogState {
  isOpen: boolean;
  mode: DialogMode;
  selectedId: string | null;
}

/**
 * Filter state for time sessions
 */
export interface SessionFilters {
  clientId?: string;
  projectId?: string;
  status?: 'running' | 'paused' | 'stopped';
  isBillable?: boolean;
  isBilled?: boolean;
  fromDate?: string;
  toDate?: string;
  sortBy?: 'start_time' | 'duration' | 'amount';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Filter state for projects
 */
export interface ProjectFilters {
  clientId?: string;
  isActive?: boolean;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Filter state for clients
 */
export interface ClientFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Statistics for dashboard
 */
export interface DashboardStats {
  unbilledHours: number;
  unbilledAmount: number;
  activeProjectsCount: number;
  thisWeekHours: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  total?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Sort configuration
 */
export interface SortConfig<T = string> {
  field: T;
  order: 'asc' | 'desc';
}

/**
 * Form field error
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Toast notification
 */
export interface ToastNotification {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

/**
 * View mode for lists
 */
export type ViewMode = 'table' | 'grid' | 'list';

/**
 * Color palette for projects
 */
export const PROJECT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];
