import { FastifyInstance } from 'fastify';
import { projectController } from '../controllers/projectController.js';

export async function projectRoutes(fastify: FastifyInstance) {
  // Get all projects with optional filtering
  // Query params: clientId, isActive, isArchived, page, limit
  fastify.get('/projects', projectController.getAllProjects);

  // Get active projects with unbilled time (dashboard endpoint)
  fastify.get('/projects/active/unbilled', projectController.getActiveProjectsWithUnbilledTime);

  // Get a single project by ID
  fastify.get('/projects/:id', projectController.getProjectById);

  // Get all projects for a specific client
  fastify.get('/clients/:id/projects', projectController.getProjectsByClient);

  // Create a new project
  fastify.post('/projects', projectController.createProject);

  // Update an existing project
  fastify.put('/projects/:id', projectController.updateProject);

  // Delete a project (soft delete if it has time sessions)
  fastify.delete('/projects/:id', projectController.deleteProject);

  // Toggle project active status
  fastify.patch('/projects/:id/toggle-active', projectController.toggleProjectActive);

  // Archive a project
  fastify.patch('/projects/:id/archive', projectController.archiveProject);

  // Unarchive a project
  fastify.patch('/projects/:id/unarchive', projectController.unarchiveProject);

  // Get unbilled time statistics for a project
  fastify.get('/projects/:id/unbilled-stats', projectController.getUnbilledStats);
}
