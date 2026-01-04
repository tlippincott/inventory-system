import { db } from '../db/client.js';
import type {
  TimeSession,
  TimeSessionQuery,
} from '@invoice-system/shared';

export const timeSessionModel = {
  /**
   * Find all time sessions with optional filtering
   */
  async findAll(query: TimeSessionQuery = {}): Promise<TimeSession[]> {
    let queryBuilder = db('time_sessions')
      .select(
        'time_sessions.*',
        db.raw('json_build_object(\'id\', projects.id, \'name\', projects.name, \'color\', projects.color) as project'),
        db.raw('json_build_object(\'id\', clients.id, \'name\', clients.name, \'companyName\', clients.company_name) as client')
      )
      .leftJoin('projects', 'time_sessions.project_id', 'projects.id')
      .leftJoin('clients', 'time_sessions.client_id', 'clients.id');

    // Apply filters
    if (query.clientId) {
      queryBuilder = queryBuilder.where('time_sessions.client_id', query.clientId);
    }

    if (query.projectId) {
      queryBuilder = queryBuilder.where('time_sessions.project_id', query.projectId);
    }

    if (query.status) {
      queryBuilder = queryBuilder.where('time_sessions.status', query.status);
    }

    if (query.isBillable !== undefined) {
      queryBuilder = queryBuilder.where('time_sessions.is_billable', query.isBillable);
    }

    if (query.isBilled !== undefined) {
      if (query.isBilled) {
        queryBuilder = queryBuilder.whereNotNull('time_sessions.invoice_item_id');
      } else {
        queryBuilder = queryBuilder.whereNull('time_sessions.invoice_item_id');
      }
    }

    if (query.fromDate) {
      queryBuilder = queryBuilder.where('time_sessions.start_time', '>=', query.fromDate);
    }

    if (query.toDate) {
      queryBuilder = queryBuilder.where('time_sessions.start_time', '<=', query.toDate);
    }

    // Apply sorting
    const sortBy = query.sortBy || 'start_time';
    const order = query.order || 'desc';

    const sortColumn = sortBy === 'start_time' ? 'time_sessions.start_time'
      : sortBy === 'duration' ? 'time_sessions.duration_seconds'
      : sortBy === 'amount' ? 'time_sessions.billable_amount_cents'
      : 'time_sessions.start_time';

    queryBuilder = queryBuilder.orderBy(sortColumn, order);

    // Apply pagination
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100); // Max 100
    const offset = (page - 1) * limit;

    queryBuilder = queryBuilder.limit(limit).offset(offset);

    const rows = await queryBuilder;

    return rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      clientId: row.client_id,
      taskDescription: row.task_description,
      startTime: row.start_time,
      endTime: row.end_time,
      durationSeconds: Number(row.duration_seconds),
      status: row.status,
      hourlyRateCents: Number(row.hourly_rate_cents),
      billableAmountCents: Number(row.billable_amount_cents),
      isBillable: row.is_billable,
      invoiceItemId: row.invoice_item_id,
      billedAt: row.billed_at,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      project: row.project,
      client: row.client,
    }));
  },

  /**
   * Find a single time session by ID
   */
  async findById(id: string): Promise<TimeSession | null> {
    const row = await db('time_sessions')
      .select(
        'time_sessions.*',
        db.raw('json_build_object(\'id\', projects.id, \'name\', projects.name, \'color\', projects.color) as project'),
        db.raw('json_build_object(\'id\', clients.id, \'name\', clients.name, \'companyName\', clients.company_name) as client')
      )
      .leftJoin('projects', 'time_sessions.project_id', 'projects.id')
      .leftJoin('clients', 'time_sessions.client_id', 'clients.id')
      .where('time_sessions.id', id)
      .first();

    if (!row) return null;

    return {
      id: row.id,
      projectId: row.project_id,
      clientId: row.client_id,
      taskDescription: row.task_description,
      startTime: row.start_time,
      endTime: row.end_time,
      durationSeconds: Number(row.duration_seconds),
      status: row.status,
      hourlyRateCents: Number(row.hourly_rate_cents),
      billableAmountCents: Number(row.billable_amount_cents),
      isBillable: row.is_billable,
      invoiceItemId: row.invoice_item_id,
      billedAt: row.billed_at,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      project: row.project,
      client: row.client,
    };
  },

  /**
   * Find all sessions for a specific project
   */
  async findByProject(projectId: string): Promise<TimeSession[]> {
    return this.findAll({ projectId });
  },

  /**
   * Find the currently active (running or paused) session
   */
  async findActiveSession(): Promise<TimeSession | null> {
    const row = await db('time_sessions')
      .select(
        'time_sessions.*',
        db.raw('json_build_object(\'id\', projects.id, \'name\', projects.name, \'color\', projects.color) as project'),
        db.raw('json_build_object(\'id\', clients.id, \'name\', clients.name, \'companyName\', clients.company_name) as client')
      )
      .leftJoin('projects', 'time_sessions.project_id', 'projects.id')
      .leftJoin('clients', 'time_sessions.client_id', 'clients.id')
      .whereIn('time_sessions.status', ['running', 'paused'])
      .first();

    if (!row) return null;

    return {
      id: row.id,
      projectId: row.project_id,
      clientId: row.client_id,
      taskDescription: row.task_description,
      startTime: row.start_time,
      endTime: row.end_time,
      durationSeconds: Number(row.duration_seconds),
      status: row.status,
      hourlyRateCents: Number(row.hourly_rate_cents),
      billableAmountCents: Number(row.billable_amount_cents),
      isBillable: row.is_billable,
      invoiceItemId: row.invoice_item_id,
      billedAt: row.billed_at,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      project: row.project,
      client: row.client,
    };
  },

  /**
   * Find the currently running (not paused) session
   */
  async findRunningSession(): Promise<TimeSession | null> {
    const row = await db('time_sessions')
      .select(
        'time_sessions.*',
        db.raw('json_build_object(\'id\', projects.id, \'name\', projects.name, \'color\', projects.color) as project'),
        db.raw('json_build_object(\'id\', clients.id, \'name\', clients.name, \'companyName\', clients.company_name) as client')
      )
      .leftJoin('projects', 'time_sessions.project_id', 'projects.id')
      .leftJoin('clients', 'time_sessions.client_id', 'clients.id')
      .where('time_sessions.status', 'running')
      .first();

    if (!row) return null;

    return {
      id: row.id,
      projectId: row.project_id,
      clientId: row.client_id,
      taskDescription: row.task_description,
      startTime: row.start_time,
      endTime: row.end_time,
      durationSeconds: Number(row.duration_seconds),
      status: row.status,
      hourlyRateCents: Number(row.hourly_rate_cents),
      billableAmountCents: Number(row.billable_amount_cents),
      isBillable: row.is_billable,
      invoiceItemId: row.invoice_item_id,
      billedAt: row.billed_at,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      project: row.project,
      client: row.client,
    };
  },

  /**
   * Find unbilled sessions (stopped, billable, not yet invoiced)
   */
  async findUnbilled(filters: { clientId?: string; projectId?: string } = {}): Promise<TimeSession[]> {
    let queryBuilder = db('time_sessions')
      .select(
        'time_sessions.*',
        db.raw('json_build_object(\'id\', projects.id, \'name\', projects.name, \'color\', projects.color) as project'),
        db.raw('json_build_object(\'id\', clients.id, \'name\', clients.name, \'companyName\', clients.company_name) as client')
      )
      .leftJoin('projects', 'time_sessions.project_id', 'projects.id')
      .leftJoin('clients', 'time_sessions.client_id', 'clients.id')
      .where('time_sessions.status', 'stopped')
      .whereNull('time_sessions.invoice_item_id')
      .where('time_sessions.is_billable', true)
      .orderBy('time_sessions.start_time', 'desc');

    if (filters.clientId) {
      queryBuilder = queryBuilder.where('time_sessions.client_id', filters.clientId);
    }

    if (filters.projectId) {
      queryBuilder = queryBuilder.where('time_sessions.project_id', filters.projectId);
    }

    const rows = await queryBuilder;

    return rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      clientId: row.client_id,
      taskDescription: row.task_description,
      startTime: row.start_time,
      endTime: row.end_time,
      durationSeconds: Number(row.duration_seconds),
      status: row.status,
      hourlyRateCents: Number(row.hourly_rate_cents),
      billableAmountCents: Number(row.billable_amount_cents),
      isBillable: row.is_billable,
      invoiceItemId: row.invoice_item_id,
      billedAt: row.billed_at,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      project: row.project,
      client: row.client,
    }));
  },

  /**
   * Create a new time session
   */
  async create(data: Partial<TimeSession>): Promise<TimeSession> {
    const [row] = await db('time_sessions')
      .insert({
        project_id: data.projectId,
        client_id: data.clientId,
        task_description: data.taskDescription,
        start_time: data.startTime,
        end_time: data.endTime || null,
        duration_seconds: data.durationSeconds || null,
        status: data.status || 'running',
        hourly_rate_cents: data.hourlyRateCents,
        billable_amount_cents: data.billableAmountCents || null,
        is_billable: data.isBillable !== undefined ? data.isBillable : true,
        invoice_item_id: data.invoiceItemId || null,
        billed_at: data.billedAt || null,
        notes: data.notes || null,
      })
      .returning('*');

    // Fetch with joins
    const session = await this.findById(row.id);
    if (!session) {
      throw new Error('Failed to create time session');
    }

    return session;
  },

  /**
   * Update a time session
   */
  async update(id: string, data: Partial<TimeSession>): Promise<TimeSession> {
    const updateData: Record<string, any> = {
      updated_at: db.fn.now(),
    };

    if (data.taskDescription !== undefined) updateData.task_description = data.taskDescription;
    if (data.startTime !== undefined) updateData.start_time = data.startTime;
    if (data.endTime !== undefined) updateData.end_time = data.endTime;
    if (data.durationSeconds !== undefined) updateData.duration_seconds = data.durationSeconds;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.hourlyRateCents !== undefined) updateData.hourly_rate_cents = data.hourlyRateCents;
    if (data.billableAmountCents !== undefined) updateData.billable_amount_cents = data.billableAmountCents;
    if (data.isBillable !== undefined) updateData.is_billable = data.isBillable;
    if (data.invoiceItemId !== undefined) updateData.invoice_item_id = data.invoiceItemId;
    if (data.billedAt !== undefined) updateData.billed_at = data.billedAt;
    if (data.notes !== undefined) updateData.notes = data.notes;

    await db('time_sessions')
      .where({ id })
      .update(updateData);

    const session = await this.findById(id);
    if (!session) {
      throw new Error('Time session not found after update');
    }

    return session;
  },

  /**
   * Delete a time session (hard delete)
   */
  async delete(id: string): Promise<void> {
    await db('time_sessions').where({ id }).del();
  },

  /**
   * Bulk update multiple time sessions
   */
  async bulkUpdate(ids: string[], data: Partial<TimeSession>): Promise<number> {
    const updateData: Record<string, any> = {
      updated_at: db.fn.now(),
    };

    if (data.isBillable !== undefined) updateData.is_billable = data.isBillable;
    if (data.hourlyRateCents !== undefined) updateData.hourly_rate_cents = data.hourlyRateCents;
    if (data.billableAmountCents !== undefined) updateData.billable_amount_cents = data.billableAmountCents;

    const count = await db('time_sessions')
      .whereIn('id', ids)
      .update(updateData);

    return count;
  },

  /**
   * Get billing summary (aggregate stats)
   */
  async getBillingSummary(filters: {
    clientId?: string;
    projectId?: string;
    fromDate?: Date;
    toDate?: Date;
  } = {}): Promise<{
    totalDurationSeconds: number;
    totalAmountCents: number;
    sessionCount: number;
  }> {
    let queryBuilder = db('time_sessions')
      .where('status', 'stopped')
      .whereNull('invoice_item_id')
      .where('is_billable', true);

    if (filters.clientId) {
      queryBuilder = queryBuilder.where('client_id', filters.clientId);
    }

    if (filters.projectId) {
      queryBuilder = queryBuilder.where('project_id', filters.projectId);
    }

    if (filters.fromDate) {
      queryBuilder = queryBuilder.where('start_time', '>=', filters.fromDate);
    }

    if (filters.toDate) {
      queryBuilder = queryBuilder.where('start_time', '<=', filters.toDate);
    }

    const result = await queryBuilder
      .select(
        db.raw('COALESCE(SUM(duration_seconds), 0) as total_duration_seconds'),
        db.raw('COALESCE(SUM(billable_amount_cents), 0) as total_amount_cents'),
        db.raw('COUNT(*) as session_count')
      )
      .first();

    return {
      totalDurationSeconds: Number(result?.total_duration_seconds || 0),
      totalAmountCents: Number(result?.total_amount_cents || 0),
      sessionCount: Number(result?.session_count || 0),
    };
  },
};
