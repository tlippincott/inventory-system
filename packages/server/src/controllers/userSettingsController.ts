import { FastifyRequest, FastifyReply } from 'fastify';
import { userSettingsService } from '../services/userSettingsService.js';
import type { UpdateUserSettingsDTO } from '@invoice-system/shared';

export const userSettingsController = {
  /**
   * GET /api/v1/user-settings
   * Get current user settings (creates with defaults if doesn't exist)
   */
  async getUserSettings(
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    const settings = await userSettingsService.getUserSettings();
    return reply.send({ data: settings });
  },

  /**
   * PUT /api/v1/user-settings
   * Update user settings (partial update)
   */
  async updateUserSettings(
    request: FastifyRequest<{ Body: UpdateUserSettingsDTO }>,
    reply: FastifyReply
  ) {
    const settings = await userSettingsService.updateUserSettings(request.body);
    return reply.send({ data: settings });
  },
};
