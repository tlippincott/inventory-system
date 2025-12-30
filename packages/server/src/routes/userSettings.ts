import { FastifyInstance } from 'fastify';
import { userSettingsController } from '../controllers/userSettingsController.js';

export async function userSettingsRoutes(fastify: FastifyInstance) {
  // Get current user settings (creates with defaults if doesn't exist)
  fastify.get('/user-settings', userSettingsController.getUserSettings);

  // Update user settings (partial update)
  fastify.put('/user-settings', userSettingsController.updateUserSettings);
}
