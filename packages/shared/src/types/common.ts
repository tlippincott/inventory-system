// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// Dashboard statistics
export interface DashboardStats {
  totalRevenueCents: number;
  outstandingCents: number;
  overdueCents: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
}

// Utility types
export type Cents = number;
export type Dollars = number;
