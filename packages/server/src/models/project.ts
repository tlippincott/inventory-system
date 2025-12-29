import { db } from '../db/client.js';
import type { Project, CreateProjectDTO, UpdateProjectDTO, ProjectQuery } from '@invoice-system/shared';

export const projectModel = {
  /**
   * Find all projects with optional filtering
   */
  async findAll(query: ProjectQuery = {}): Promise<Project[]> {
    let queryBuilder = db('projects')
      .select(
        'projects.*',
        db.raw('json_build_object(\'id\', clients.id, \'name\', clients.name, \'companyName\', clients.company_name) as client')
      )
      .leftJoin('clients', 'projects.client_id', 'clients.id')
      .orderBy('projects.created_at', 'desc');

    // Apply filters
    if (query.clientId) {
      queryBuilder = queryBuilder.where('projects.client_id', query.clientId);
    }

    if (query.isActive !== undefined) {
      queryBuilder = queryBuilder.where('projects.is_active', query.isActive);
    }

    if (query.isArchived !== undefined) {
      queryBuilder = queryBuilder.where('projects.is_archived', query.isArchived);
    }

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;

    queryBuilder = queryBuilder.limit(limit).offset(offset);

    const rows = await queryBuilder;

    return rows.map((row) => ({
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      description: row.description,
      defaultHourlyRateCents: row.default_hourly_rate_cents,
      color: row.color,
      isActive: row.is_active,
      isArchived: row.is_archived,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      client: row.client,
    }));
  },

  /**
   * Find a single project by ID
   */
  async findById(id: string): Promise<Project | null> {
    const row = await db('projects')
      .select(
        'projects.*',
        db.raw('json_build_object(\'id\', clients.id, \'name\', clients.name, \'companyName\', clients.company_name) as client')
      )
      .leftJoin('clients', 'projects.client_id', 'clients.id')
      .where('projects.id', id)
      .first();

    if (!row) return null;

    return {
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      description: row.description,
      defaultHourlyRateCents: row.default_hourly_rate_cents,
      color: row.color,
      isActive: row.is_active,
      isArchived: row.is_archived,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      client: row.client,
    };
  },

  /**
   * Find projects by client ID
   */
  async findByClient(clientId: string): Promise<Project[]> {
    return this.findAll({ clientId });
  },

  /**
   * Create a new project
   */
  async create(data: CreateProjectDTO): Promise<Project> {
    const [row] = await db('projects')
      .insert({
        client_id: data.clientId,
        name: data.name,
        description: data.description || null,
        default_hourly_rate_cents: data.defaultHourlyRateCents || 0,
        color: data.color || null,
        is_active: true,
        is_archived: false,
      })
      .returning('*');

    // Fetch with client info
    const project = await this.findById(row.id);
    if (!project) {
      throw new Error('Failed to create project');
    }

    return project;
  },

  /**
   * Update a project
   */
  async update(id: string, data: UpdateProjectDTO): Promise<Project> {
    const updateData: Record<string, any> = {
      updated_at: db.fn.now(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.defaultHourlyRateCents !== undefined) updateData.default_hourly_rate_cents = data.defaultHourlyRateCents;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.isArchived !== undefined) updateData.is_archived = data.isArchived;

    await db('projects')
      .where({ id })
      .update(updateData);

    const project = await this.findById(id);
    if (!project) {
      throw new Error('Project not found after update');
    }

    return project;
  },

  /**
   * Delete a project (soft delete if it has sessions)
   */
  async delete(id: string): Promise<void> {
    // Check if project has time sessions
    const sessionCount = await db('time_sessions')
      .where({ project_id: id })
      .count('* as count')
      .first();

    if (sessionCount && Number(sessionCount.count) > 0) {
      // Soft delete: archive the project
      await db('projects')
        .where({ id })
        .update({
          is_archived: true,
          is_active: false,
          updated_at: db.fn.now(),
        });
    } else {
      // Hard delete: no sessions exist
      await db('projects').where({ id }).del();
    }
  },

  /**
   * Get unbilled time for a project
   */
  async getUnbilledStats(projectId: string): Promise<{
    totalSeconds: number;
    totalAmountCents: number;
    sessionCount: number;
  }> {
    const result = await db('time_sessions')
      .where({
        project_id: projectId,
        is_billable: true,
      })
      .whereNull('invoice_item_id')
      .where('status', 'stopped')
      .select(
        db.raw('COALESCE(SUM(duration_seconds), 0) as total_seconds'),
        db.raw('COALESCE(SUM(billable_amount_cents), 0) as total_amount_cents'),
        db.raw('COUNT(*) as session_count')
      )
      .first();

    return {
      totalSeconds: Number(result?.total_seconds || 0),
      totalAmountCents: Number(result?.total_amount_cents || 0),
      sessionCount: Number(result?.session_count || 0),
    };
  },

  /**
   * Get active projects with unbilled time (for dashboard)
   */
  async getActiveWithUnbilledTime(): Promise<Array<Project & {
    unbilledSeconds: number;
    unbilledAmountCents: number;
  }>> {
    const projects = await this.findAll({ isActive: true, isArchived: false });

    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const stats = await this.getUnbilledStats(project.id);
        return {
          ...project,
          unbilledSeconds: stats.totalSeconds,
          unbilledAmountCents: stats.totalAmountCents,
        };
      })
    );

    // Filter to only projects with unbilled time
    return projectsWithStats.filter(p => p.unbilledSeconds > 0);
  },
};
