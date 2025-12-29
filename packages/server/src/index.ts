import { buildApp } from './app.js';
import { env } from './config/env.js';
import { testConnection, closeConnection } from './db/client.js';

async function start() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }

    // Build and start server
    const server = await buildApp();

    await server.listen({
      port: env.port,
      host: env.host,
    });

    console.log(`
┌─────────────────────────────────────────┐
│ Invoice System API Server               │
│                                         │
│ Environment: ${env.nodeEnv.padEnd(27)} │
│ Server:      http://${env.host}:${env.port.toString().padEnd(14)} │
│ Health:      http://${env.host}:${env.port}/health     │
└─────────────────────────────────────────┘
    `);

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        await server.close();
        await closeConnection();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
