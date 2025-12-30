import { FastifyRequest, FastifyReply } from 'fastify';
import { timeSessionService } from '../services/timeSessionService.js';
import type {
  StartTimeSessionDTO,
  UpdateTimeSessionDTO,
  BulkUpdateSessionsDTO,
  TimeSessionQuery,
} from '@invoice-system/shared';

interface SessionParams {
  id: string;
}

interface UnbilledQuery {
  clientId?: string;
  projectId?: string;
}

interface BillingSummaryQuery {
  clientId?: string;
  projectId?: string;
  fromDate?: string;
  toDate?: string;
}

export const timeSessionController = {
  /**
   * GET /api/v1/time-sessions
   * Get all time sessions with optional filtering
   */
  async getAllSessions(
    request: FastifyRequest<{ Querystring: TimeSessionQuery }>,
    reply: FastifyReply
  ) {
    const sessions = await timeSessionService.getAllSessions(request.query);
    return reply.send({
      data: sessions,
      total: sessions.length,
    });
  },

  /**
   * GET /api/v1/time-sessions/:id
   * Get a single time session by ID
   */
  async getSessionById(
    request: FastifyRequest<{ Params: SessionParams }>,
    reply: FastifyReply
  ) {
    const session = await timeSessionService.getSessionById(request.params.id);
    return reply.send({ data: session });
  },

  /**
   * POST /api/v1/time-sessions/start
   * Start a new time session
   */
  async startSession(
    request: FastifyRequest<{ Body: StartTimeSessionDTO }>,
    reply: FastifyReply
  ) {
    const session = await timeSessionService.startSession(request.body);
    return reply.status(201).send({ data: session });
  },

  /**
   * PUT /api/v1/time-sessions/:id
   * Update an existing time session
   */
  async updateSession(
    request: FastifyRequest<{ Params: SessionParams; Body: UpdateTimeSessionDTO }>,
    reply: FastifyReply
  ) {
    const session = await timeSessionService.updateSession(
      request.params.id,
      request.body
    );
    return reply.send({ data: session });
  },

  /**
   * DELETE /api/v1/time-sessions/:id
   * Delete a time session
   */
  async deleteSession(
    request: FastifyRequest<{ Params: SessionParams }>,
    reply: FastifyReply
  ) {
    await timeSessionService.deleteSession(request.params.id);
    return reply.send({
      message: 'Time session deleted successfully',
      deleted: true,
    });
  },

  /**
   * PATCH /api/v1/time-sessions/:id/stop
   * Stop a running or paused session
   */
  async stopSession(
    request: FastifyRequest<{ Params: SessionParams }>,
    reply: FastifyReply
  ) {
    const session = await timeSessionService.stopSession(request.params.id);
    return reply.send({ data: session });
  },

  /**
   * PATCH /api/v1/time-sessions/:id/pause
   * Pause a running session
   */
  async pauseSession(
    request: FastifyRequest<{ Params: SessionParams }>,
    reply: FastifyReply
  ) {
    const session = await timeSessionService.pauseSession(request.params.id);
    return reply.send({ data: session });
  },

  /**
   * PATCH /api/v1/time-sessions/:id/resume
   * Resume a paused session
   */
  async resumeSession(
    request: FastifyRequest<{ Params: SessionParams }>,
    reply: FastifyReply
  ) {
    const session = await timeSessionService.resumeSession(request.params.id);
    return reply.send({ data: session });
  },

  /**
   * GET /api/v1/time-sessions/active
   * Get the currently running session
   */
  async getActiveSession(
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    const session = await timeSessionService.getActiveSession();
    return reply.send({ data: session });
  },

  /**
   * GET /api/v1/time-sessions/unbilled
   * Get all unbilled sessions
   */
  async getUnbilledSessions(
    request: FastifyRequest<{ Querystring: UnbilledQuery }>,
    reply: FastifyReply
  ) {
    const sessions = await timeSessionService.getUnbilledSessions(
      request.query.clientId,
      request.query.projectId
    );
    return reply.send({
      data: sessions,
      total: sessions.length,
    });
  },

  /**
   * GET /api/v1/projects/:id/time-sessions
   * Get all sessions for a specific project
   */
  async getSessionsByProject(
    request: FastifyRequest<{ Params: SessionParams }>,
    reply: FastifyReply
  ) {
    const sessions = await timeSessionService.getSessionsByProject(request.params.id);
    return reply.send({
      data: sessions,
      total: sessions.length,
    });
  },

  /**
   * PATCH /api/v1/time-sessions/bulk-update
   * Update multiple sessions at once
   */
  async bulkUpdateSessions(
    request: FastifyRequest<{ Body: BulkUpdateSessionsDTO }>,
    reply: FastifyReply
  ) {
    const result = await timeSessionService.bulkUpdateSessions(request.body);
    return reply.send({ data: result });
  },

  /**
   * GET /api/v1/time-sessions/billing-summary
   * Get billing summary for unbilled sessions
   */
  async getBillingSummary(
    request: FastifyRequest<{ Querystring: BillingSummaryQuery }>,
    reply: FastifyReply
  ) {
    const query: any = {};

    if (request.query.clientId) {
      query.clientId = request.query.clientId;
    }

    if (request.query.projectId) {
      query.projectId = request.query.projectId;
    }

    if (request.query.fromDate) {
      query.fromDate = new Date(request.query.fromDate);
    }

    if (request.query.toDate) {
      query.toDate = new Date(request.query.toDate);
    }

    const summary = await timeSessionService.getBillingSummary(query);
    return reply.send({ data: summary });
  },
};
