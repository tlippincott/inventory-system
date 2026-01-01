import { FastifyInstance } from 'fastify';
import { dashboardController } from '../controllers/dashboardController.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  // Get dashboard statistics
  fastify.get('/dashboard/stats', dashboardController.getStats);
}
