import { FastifyRequest, FastifyReply } from 'fastify';
import { projectService } from '../services/projectService.js';
import type {
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectQuery
} from '@invoice-system/shared';

interface ProjectParams {
  id: string;
}

export const projectController = {
  /**
   * GET /api/v1/projects
   * Get all projects with optional filtering
   */
  async getAllProjects(
    request: FastifyRequest<{ Querystring: ProjectQuery }>,
    reply: FastifyReply
  ) {
    const projects = await projectService.getAllProjects(request.query);
    return reply.send({
      data: projects,
      total: projects.length,
    });
  },

  /**
   * GET /api/v1/projects/:id
   * Get a single project by ID
   */
  async getProjectById(
    request: FastifyRequest<{ Params: ProjectParams }>,
    reply: FastifyReply
  ) {
    const project = await projectService.getProjectById(request.params.id);
    return reply.send({ data: project });
  },

  /**
   * GET /api/v1/clients/:id/projects
   * Get all projects for a specific client
   */
  async getProjectsByClient(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const projects = await projectService.getProjectsByClient(request.params.id);
    return reply.send({
      data: projects,
      total: projects.length,
    });
  },

  /**
   * POST /api/v1/projects
   * Create a new project
   */
  async createProject(
    request: FastifyRequest<{ Body: CreateProjectDTO }>,
    reply: FastifyReply
  ) {
    const project = await projectService.createProject(request.body);
    return reply.status(201).send({ data: project });
  },

  /**
   * PUT /api/v1/projects/:id
   * Update an existing project
   */
  async updateProject(
    request: FastifyRequest<{ Params: ProjectParams; Body: UpdateProjectDTO }>,
    reply: FastifyReply
  ) {
    const project = await projectService.updateProject(
      request.params.id,
      request.body
    );
    return reply.send({ data: project });
  },

  /**
   * DELETE /api/v1/projects/:id
   * Delete a project (soft delete if it has time sessions)
   */
  async deleteProject(
    request: FastifyRequest<{ Params: ProjectParams }>,
    reply: FastifyReply
  ) {
    const result = await projectService.deleteProject(request.params.id);

    return reply.send({
      message: result.archived
        ? 'Project archived because it has time sessions'
        : 'Project deleted successfully',
      ...result,
    });
  },

  /**
   * PATCH /api/v1/projects/:id/toggle-active
   * Toggle project active status
   */
  async toggleProjectActive(
    request: FastifyRequest<{ Params: ProjectParams }>,
    reply: FastifyReply
  ) {
    const project = await projectService.toggleProjectActive(request.params.id);
    return reply.send({ data: project });
  },

  /**
   * PATCH /api/v1/projects/:id/archive
   * Archive a project
   */
  async archiveProject(
    request: FastifyRequest<{ Params: ProjectParams }>,
    reply: FastifyReply
  ) {
    const project = await projectService.archiveProject(request.params.id);
    return reply.send({ data: project });
  },

  /**
   * PATCH /api/v1/projects/:id/unarchive
   * Unarchive a project
   */
  async unarchiveProject(
    request: FastifyRequest<{ Params: ProjectParams }>,
    reply: FastifyReply
  ) {
    const project = await projectService.unarchiveProject(request.params.id);
    return reply.send({ data: project });
  },

  /**
   * GET /api/v1/projects/:id/unbilled-stats
   * Get unbilled time statistics for a project
   */
  async getUnbilledStats(
    request: FastifyRequest<{ Params: ProjectParams }>,
    reply: FastifyReply
  ) {
    const stats = await projectService.getUnbilledStats(request.params.id);
    return reply.send({ data: stats });
  },

  /**
   * GET /api/v1/projects/active/unbilled
   * Get active projects with unbilled time (for dashboard)
   */
  async getActiveProjectsWithUnbilledTime(
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    const projects = await projectService.getActiveProjectsWithUnbilledTime();
    return reply.send({
      data: projects,
      total: projects.length,
    });
  },
};
