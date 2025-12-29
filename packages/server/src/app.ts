import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRoutes } from './routes/health.js';
import { projectRoutes } from './routes/project.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: env.isDevelopment ? 'debug' : 'info',
      transport: env.isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  });

  // Register plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: env.isDevelopment ? false : undefined,
  });

  await fastify.register(cors, {
    origin: env.cors.origin,
    credentials: true,
  });

  // Register error handler
  fastify.setErrorHandler(errorHandler);

  // Register routes
  await fastify.register(healthRoutes);

  // API v1 routes
  await fastify.register(projectRoutes, { prefix: '/api/v1' });
  // await fastify.register(clientRoutes, { prefix: '/api/v1' });
  // await fastify.register(invoiceRoutes, { prefix: '/api/v1' });
  // await fastify.register(paymentRoutes, { prefix: '/api/v1' });

  return fastify;
}
