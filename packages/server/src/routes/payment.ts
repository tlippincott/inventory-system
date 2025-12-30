import { FastifyInstance } from 'fastify';
import { paymentController } from '../controllers/paymentController.js';

export async function paymentRoutes(fastify: FastifyInstance) {
  // Core CRUD - payment-centric routes

  // Get all payments with optional filtering
  // Query params: invoiceId, paymentMethod, fromDate, toDate, sortBy, order, page, limit
  fastify.get('/payments', paymentController.getAllPayments);

  // Create a new payment (auto-updates invoice status to 'paid' if fully paid)
  fastify.post('/payments', paymentController.createPayment);

  // Get a single payment by ID with invoice relation
  fastify.get('/payments/:id', paymentController.getPaymentById);

  // Update an existing payment (recalculates invoice status)
  fastify.put('/payments/:id', paymentController.updatePayment);

  // Delete a payment (recalculates invoice status - may revert 'paid' to 'sent')
  fastify.delete('/payments/:id', paymentController.deletePayment);

  // Invoice relationship

  // Get all payments for a specific invoice
  fastify.get('/invoices/:id/payments', paymentController.getPaymentsByInvoice);
}
