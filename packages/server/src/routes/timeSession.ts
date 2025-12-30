import { FastifyInstance } from 'fastify';
import { timeSessionController } from '../controllers/timeSessionController.js';

export async function timeSessionRoutes(fastify: FastifyInstance) {
  // Specialized queries FIRST (before :id routes to avoid conflicts)

  // Get currently running session
  fastify.get('/time-sessions/active', timeSessionController.getActiveSession);

  // Get unbilled sessions with optional filtering
  // Query params: clientId, projectId
  fastify.get('/time-sessions/unbilled', timeSessionController.getUnbilledSessions);

  // Get billing summary
  // Query params: clientId, projectId, fromDate, toDate
  fastify.get('/time-sessions/billing-summary', timeSessionController.getBillingSummary);

  // Bulk update sessions
  fastify.patch('/time-sessions/bulk-update', timeSessionController.bulkUpdateSessions);

  // Get all time sessions with optional filtering
  // Query params: clientId, projectId, status, isBillable, isBilled, fromDate, toDate, sortBy, order, page, limit
  fastify.get('/time-sessions', timeSessionController.getAllSessions);

  // Start a new time session
  fastify.post('/time-sessions/start', timeSessionController.startSession);

  // Get a single time session by ID
  fastify.get('/time-sessions/:id', timeSessionController.getSessionById);

  // Update an existing time session
  fastify.put('/time-sessions/:id', timeSessionController.updateSession);

  // Delete a time session
  fastify.delete('/time-sessions/:id', timeSessionController.deleteSession);

  // Timer control endpoints (PATCH for state changes)

  // Stop a running or paused session
  fastify.patch('/time-sessions/:id/stop', timeSessionController.stopSession);

  // Pause a running session
  fastify.patch('/time-sessions/:id/pause', timeSessionController.pauseSession);

  // Resume a paused session
  fastify.patch('/time-sessions/:id/resume', timeSessionController.resumeSession);

  // Project relationship

  // Get all sessions for a specific project
  fastify.get('/projects/:id/time-sessions', timeSessionController.getSessionsByProject);
}
