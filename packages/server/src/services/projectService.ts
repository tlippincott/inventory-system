import { projectModel } from '../models/project.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
} from '@invoice-system/shared';
import { db } from '../db/client.js';
import type {
  Project,
  CreateProjectDTO,
  UpdateProjectDTO,
} from '@invoice-system/shared';

class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class BadRequestError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export const projectService = {
  /**
   * Get all projects with optional filtering
   */
  async getAllProjects(query: unknown): Promise<Project[]> {
    // Validate query parameters
    const validatedQuery = projectQuerySchema.parse(query);

    // Fetch projects from model
    return await projectModel.findAll(validatedQuery);
  },

  /**
   * Get a single project by ID
   */
  async getProjectById(id: string): Promise<Project> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid project ID');
    }

    const project = await projectModel.findById(id);

    if (!project) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }

    return project;
  },

  /**
   * Get all projects for a specific client
   */
  async getProjectsByClient(clientId: string): Promise<Project[]> {
    // Validate UUID format
    if (!clientId || typeof clientId !== 'string') {
      throw new BadRequestError('Invalid client ID');
    }

    // Verify client exists
    const client = await db('clients').where({ id: clientId }).first();
    if (!client) {
      throw new NotFoundError(`Client with ID ${clientId} not found`);
    }

    return await projectModel.findByClient(clientId);
  },

  /**
   * Create a new project
   */
  async createProject(data: unknown): Promise<Project> {
    // Validate input data
    const validatedData = createProjectSchema.parse(data) as CreateProjectDTO;

    // Verify client exists
    const client = await db('clients').where({ id: validatedData.clientId }).first();
    if (!client) {
      throw new NotFoundError(`Client with ID ${validatedData.clientId} not found`);
    }

    // Create project
    return await projectModel.create(validatedData);
  },

  /**
   * Update an existing project
   */
  async updateProject(id: string, data: unknown): Promise<Project> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid project ID');
    }

    // Validate input data
    const validatedData = updateProjectSchema.parse(data) as UpdateProjectDTO;

    // Check if project exists
    const existingProject = await projectModel.findById(id);
    if (!existingProject) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }

    // If updating client ID, verify new client exists
    if (validatedData.clientId) {
      const client = await db('clients').where({ id: validatedData.clientId }).first();
      if (!client) {
        throw new NotFoundError(`Client with ID ${validatedData.clientId} not found`);
      }
    }

    // Prevent archiving active projects
    if (validatedData.isArchived === true && existingProject.isActive) {
      throw new BadRequestError('Cannot archive an active project. Deactivate it first.');
    }

    // Update project
    return await projectModel.update(id, validatedData);
  },

  /**
   * Delete a project (soft delete if it has time sessions)
   */
  async deleteProject(id: string): Promise<{ deleted: boolean; archived: boolean }> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid project ID');
    }

    // Check if project exists
    const existingProject = await projectModel.findById(id);
    if (!existingProject) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }

    // Check if project has time sessions
    const sessionCount = await db('time_sessions')
      .where({ project_id: id })
      .count('* as count')
      .first();

    const hasTimeSessions = Boolean(sessionCount && Number(sessionCount.count) > 0);

    // Delete the project (model handles soft vs hard delete)
    await projectModel.delete(id);

    return {
      deleted: !hasTimeSessions, // Hard deleted if no sessions
      archived: hasTimeSessions, // Soft deleted (archived) if has sessions
    };
  },

  /**
   * Toggle project active status
   */
  async toggleProjectActive(id: string): Promise<Project> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid project ID');
    }

    // Get existing project
    const existingProject = await projectModel.findById(id);
    if (!existingProject) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }

    // Cannot activate archived projects
    if (existingProject.isArchived && !existingProject.isActive) {
      throw new BadRequestError('Cannot activate an archived project. Unarchive it first.');
    }

    // Toggle active status
    return await projectModel.update(id, {
      isActive: !existingProject.isActive,
    });
  },

  /**
   * Archive a project
   */
  async archiveProject(id: string): Promise<Project> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid project ID');
    }

    // Get existing project
    const existingProject = await projectModel.findById(id);
    if (!existingProject) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }

    // Archive and deactivate
    return await projectModel.update(id, {
      isArchived: true,
      isActive: false,
    });
  },

  /**
   * Unarchive a project
   */
  async unarchiveProject(id: string): Promise<Project> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid project ID');
    }

    // Get existing project
    const existingProject = await projectModel.findById(id);
    if (!existingProject) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }

    // Unarchive (but keep inactive - user must manually activate)
    return await projectModel.update(id, {
      isArchived: false,
    });
  },

  /**
   * Get unbilled time statistics for a project
   */
  async getUnbilledStats(id: string): Promise<{
    totalSeconds: number;
    totalAmountCents: number;
    sessionCount: number;
  }> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid project ID');
    }

    // Check if project exists
    const existingProject = await projectModel.findById(id);
    if (!existingProject) {
      throw new NotFoundError(`Project with ID ${id} not found`);
    }

    // Get unbilled stats from model
    return await projectModel.getUnbilledStats(id);
  },

  /**
   * Get active projects with unbilled time (for dashboard)
   */
  async getActiveProjectsWithUnbilledTime(): Promise<Array<Project & {
    unbilledSeconds: number;
    unbilledAmountCents: number;
  }>> {
    return await projectModel.getActiveWithUnbilledTime();
  },
};
