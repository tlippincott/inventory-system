import { clientModel } from '../models/client.js';
import {
  createClientSchema,
  updateClientSchema,
  clientQuerySchema,
} from '@invoice-system/shared';
import { db } from '../db/client.js';
import type {
  Client,
  CreateClientDTO,
  UpdateClientDTO,
  ClientStats,
} from '@invoice-system/shared';

class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class BadRequestError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export const clientService = {
  /**
   * Get all clients with optional filtering and search
   */
  async getAllClients(query: unknown): Promise<Client[]> {
    // Validate query parameters
    const validatedQuery = clientQuerySchema.parse(query);

    // Fetch clients from model
    return await clientModel.findAll(validatedQuery);
  },

  /**
   * Get a single client by ID
   */
  async getClientById(id: string): Promise<Client> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid client ID');
    }

    const client = await clientModel.findById(id);

    if (!client) {
      throw new NotFoundError(`Client with ID ${id} not found`);
    }

    return client;
  },

  /**
   * Create a new client
   */
  async createClient(data: unknown): Promise<Client> {
    // Validate input data
    const validatedData = createClientSchema.parse(data) as CreateClientDTO;

    // Check email uniqueness (if email provided)
    if (validatedData.email && validatedData.email !== '') {
      const existingClient = await clientModel.findByEmail(validatedData.email);
      if (existingClient) {
        throw new BadRequestError('A client with this email already exists');
      }
    }

    // Create client
    return await clientModel.create(validatedData);
  },

  /**
   * Update an existing client
   */
  async updateClient(id: string, data: unknown): Promise<Client> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid client ID');
    }

    // Validate input data
    const validatedData = updateClientSchema.parse(data) as UpdateClientDTO;

    // Check if client exists
    const existingClient = await clientModel.findById(id);
    if (!existingClient) {
      throw new NotFoundError(`Client with ID ${id} not found`);
    }

    // Check email uniqueness (if updating email to a different value)
    if (validatedData.email && validatedData.email !== '') {
      const emailOwner = await clientModel.findByEmail(validatedData.email);
      if (emailOwner && emailOwner.id !== id) {
        throw new BadRequestError('A client with this email already exists');
      }
    }

    // Update client
    return await clientModel.update(id, validatedData);
  },

  /**
   * Delete a client (soft delete if has invoices)
   */
  async deleteClient(id: string): Promise<{ deleted: boolean; deactivated: boolean }> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid client ID');
    }

    // Check if client exists
    const existingClient = await clientModel.findById(id);
    if (!existingClient) {
      throw new NotFoundError(`Client with ID ${id} not found`);
    }

    // Check if client has invoices
    const invoiceCount = await db('invoices')
      .where({ client_id: id })
      .count('* as count')
      .first();

    const hasInvoices = Boolean(invoiceCount && Number(invoiceCount.count) > 0);

    // Delete the client (model handles soft vs hard delete)
    await clientModel.delete(id);

    return {
      deleted: !hasInvoices, // Hard deleted if no invoices
      deactivated: hasInvoices, // Soft deleted (deactivated) if has invoices
    };
  },

  /**
   * Toggle client active status
   */
  async toggleClientActive(id: string): Promise<Client> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid client ID');
    }

    // Get existing client
    const existingClient = await clientModel.findById(id);
    if (!existingClient) {
      throw new NotFoundError(`Client with ID ${id} not found`);
    }

    // Toggle active status
    return await clientModel.update(id, {
      isActive: !existingClient.isActive,
    });
  },

  /**
   * Get client statistics
   */
  async getClientStatistics(id: string): Promise<ClientStats> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid client ID');
    }

    // Check if client exists
    const existingClient = await clientModel.findById(id);
    if (!existingClient) {
      throw new NotFoundError(`Client with ID ${id} not found`);
    }

    // Get statistics from model
    return await clientModel.getStatistics(id);
  },
};
