import { FastifyInstance } from 'fastify';
import { clientController } from '../controllers/clientController.js';

export async function clientRoutes(fastify: FastifyInstance) {
  // Get all clients with optional filtering and search
  // Query params: isActive, search, page, limit
  fastify.get('/clients', clientController.getAllClients);

  // Get client statistics (specific route before parameterized route)
  fastify.get('/clients/:id/statistics', clientController.getClientStatistics);

  // Toggle client active status (specific route before parameterized route)
  fastify.patch('/clients/:id/toggle-active', clientController.toggleClientActive);

  // Get a single client by ID
  fastify.get('/clients/:id', clientController.getClientById);

  // Create a new client
  fastify.post('/clients', clientController.createClient);

  // Update an existing client
  fastify.put('/clients/:id', clientController.updateClient);

  // Delete a client (soft delete if has invoices)
  fastify.delete('/clients/:id', clientController.deleteClient);
}
