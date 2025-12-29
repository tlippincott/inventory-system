import { FastifyRequest, FastifyReply } from 'fastify';
import { clientService } from '../services/clientService.js';
import type {
  CreateClientDTO,
  UpdateClientDTO,
  ClientQuery,
} from '@invoice-system/shared';

interface ClientParams {
  id: string;
}

export const clientController = {
  /**
   * GET /api/v1/clients
   * Get all clients with optional filtering
   */
  async getAllClients(
    request: FastifyRequest<{ Querystring: ClientQuery }>,
    reply: FastifyReply
  ) {
    const clients = await clientService.getAllClients(request.query);
    return reply.send({
      data: clients,
      total: clients.length,
    });
  },

  /**
   * GET /api/v1/clients/:id
   * Get a single client by ID
   */
  async getClientById(
    request: FastifyRequest<{ Params: ClientParams }>,
    reply: FastifyReply
  ) {
    const client = await clientService.getClientById(request.params.id);
    return reply.send({ data: client });
  },

  /**
   * POST /api/v1/clients
   * Create a new client
   */
  async createClient(
    request: FastifyRequest<{ Body: CreateClientDTO }>,
    reply: FastifyReply
  ) {
    const client = await clientService.createClient(request.body);
    return reply.status(201).send({ data: client });
  },

  /**
   * PUT /api/v1/clients/:id
   * Update an existing client
   */
  async updateClient(
    request: FastifyRequest<{ Params: ClientParams; Body: UpdateClientDTO }>,
    reply: FastifyReply
  ) {
    const client = await clientService.updateClient(
      request.params.id,
      request.body
    );
    return reply.send({ data: client });
  },

  /**
   * DELETE /api/v1/clients/:id
   * Delete a client (soft delete if has invoices)
   */
  async deleteClient(
    request: FastifyRequest<{ Params: ClientParams }>,
    reply: FastifyReply
  ) {
    const result = await clientService.deleteClient(request.params.id);

    return reply.send({
      message: result.deactivated
        ? 'Client deactivated because it has invoices'
        : 'Client deleted successfully',
      ...result,
    });
  },

  /**
   * PATCH /api/v1/clients/:id/toggle-active
   * Toggle client active status
   */
  async toggleClientActive(
    request: FastifyRequest<{ Params: ClientParams }>,
    reply: FastifyReply
  ) {
    const client = await clientService.toggleClientActive(request.params.id);
    return reply.send({ data: client });
  },

  /**
   * GET /api/v1/clients/:id/statistics
   * Get client statistics
   */
  async getClientStatistics(
    request: FastifyRequest<{ Params: ClientParams }>,
    reply: FastifyReply
  ) {
    const stats = await clientService.getClientStatistics(request.params.id);
    return reply.send({ data: stats });
  },
};
