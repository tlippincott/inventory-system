import { api } from './api';
import type { ApiResponse } from '@/types';

export interface DashboardStats {
  totalRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  activeProjects: number;
  activeClients: number;
  unbilledHours: number;
  unbilledAmount: number;
}

export const dashboardApi = {
  getStats: async () => {
    const response = await api.get<ApiResponse<DashboardStats>>(
      '/dashboard/stats'
    );
    return response.data;
  },
};
