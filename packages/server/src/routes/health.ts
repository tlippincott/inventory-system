import { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';

export async function healthRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get('/health', async (_request, reply) => {
    try {
      // Check database connection
      await db.raw('SELECT 1');

      return reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      });
    } catch (error) {
      return reply.status(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      });
    }
  });

  // Root endpoint
  fastify.get('/', async (_request, reply) => {
    return reply.send({
      name: 'Invoice System API',
      version: '1.0.0',
      status: 'running',
    });
  });
}
