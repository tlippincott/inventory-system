import { db } from '../db/client.js';

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

export const dashboardService = {
  /**
   * Get aggregated dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    // Get invoice statistics
    const invoiceStats = await db('invoices')
      .select(
        db.raw('COUNT(*) as total_invoices'),
        db.raw("COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices"),
        db.raw(
          "COUNT(*) FILTER (WHERE status IN ('draft', 'sent', 'overdue')) as unpaid_invoices"
        ),
        db.raw("COUNT(*) FILTER (WHERE status = 'overdue') as overdue_invoices"),
        db.raw("COALESCE(SUM(total_cents) FILTER (WHERE status = 'paid'), 0) as total_revenue_cents"),
        db.raw(
          "COALESCE(SUM(total_cents) FILTER (WHERE status IN ('sent', 'overdue')), 0) as outstanding_cents"
        ),
        db.raw(
          "COALESCE(SUM(total_cents) FILTER (WHERE status = 'overdue'), 0) as overdue_cents"
        )
      )
      .first();

    // Get active projects count
    const projectCount = await db('projects')
      .where({ is_active: true, is_archived: false })
      .count('id as count')
      .first();

    // Get active clients count
    const clientCount = await db('clients')
      .where({ is_active: true })
      .count('id as count')
      .first();

    // Get unbilled time sessions statistics
    const unbilledStats = await db('time_sessions')
      .whereNull('invoice_item_id')
      .where({ is_billable: true })
      .whereNotNull('duration_seconds')
      .select(
        db.raw('COALESCE(SUM(duration_seconds), 0) as total_seconds'),
        db.raw('COALESCE(SUM(billable_amount_cents), 0) as total_amount_cents')
      )
      .first();

    // Convert cents to dollars and seconds to hours
    return {
      totalRevenue: Math.round((invoiceStats?.total_revenue_cents || 0) / 100),
      outstandingAmount: Math.round((invoiceStats?.outstanding_cents || 0) / 100),
      overdueAmount: Math.round((invoiceStats?.overdue_cents || 0) / 100),
      totalInvoices: parseInt(String(invoiceStats?.total_invoices || '0')),
      paidInvoices: parseInt(String(invoiceStats?.paid_invoices || '0')),
      unpaidInvoices: parseInt(String(invoiceStats?.unpaid_invoices || '0')),
      overdueInvoices: parseInt(String(invoiceStats?.overdue_invoices || '0')),
      activeProjects: parseInt(String(projectCount?.count || '0')),
      activeClients: parseInt(String(clientCount?.count || '0')),
      unbilledHours: Math.round((unbilledStats?.total_seconds || 0) / 3600 * 100) / 100, // Round to 2 decimals
      unbilledAmount: Math.round((unbilledStats?.total_amount_cents || 0) / 100),
    };
  },
};
