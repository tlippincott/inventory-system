import { FastifyRequest, FastifyReply } from 'fastify';
import { dashboardService } from '../services/dashboardService.js';

export const dashboardController = {
  /**
   * GET /api/v1/dashboard/stats
   * Get aggregated dashboard statistics
   */
  async getStats(
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    const stats = await dashboardService.getStats();
    return reply.send({ data: stats });
  },
};
