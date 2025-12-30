import { FastifyInstance } from 'fastify';
import { invoiceController } from '../controllers/invoiceController.js';

export async function invoiceRoutes(fastify: FastifyInstance) {
  // Special creation FIRST (before :id routes to avoid conflicts)

  // Create invoice from time sessions (the killer feature!)
  fastify.post('/invoices/from-sessions', invoiceController.createInvoiceFromSessions);

  // Core CRUD

  // Get all invoices with optional filtering
  // Query params: clientId, status, fromDate, toDate, sortBy, order, page, limit
  fastify.get('/invoices', invoiceController.getAllInvoices);

  // Create a new invoice manually
  fastify.post('/invoices', invoiceController.createInvoice);

  // Get a single invoice by ID with items and client
  fastify.get('/invoices/:id', invoiceController.getInvoiceById);

  // Update an existing invoice
  fastify.put('/invoices/:id', invoiceController.updateInvoice);

  // Delete an invoice
  fastify.delete('/invoices/:id', invoiceController.deleteInvoice);

  // Status management

  // Update invoice status (draft/sent/paid/overdue/cancelled)
  fastify.patch('/invoices/:id/status', invoiceController.updateInvoiceStatus);

  // Client relationship

  // Get all invoices for a specific client
  fastify.get('/clients/:id/invoices', invoiceController.getInvoicesByClient);

  // Invoice items management

  // Add a line item to an invoice
  fastify.post('/invoices/:id/items', invoiceController.addInvoiceItem);

  // Update an invoice line item
  fastify.put('/invoices/:invoiceId/items/:itemId', invoiceController.updateInvoiceItem);

  // Delete an invoice line item
  fastify.delete('/invoices/:invoiceId/items/:itemId', invoiceController.deleteInvoiceItem);
}
