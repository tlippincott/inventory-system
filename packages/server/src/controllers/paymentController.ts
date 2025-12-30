import { FastifyRequest, FastifyReply } from 'fastify';
import { paymentService } from '../services/paymentService.js';
import type {
  CreatePaymentDTO,
  UpdatePaymentDTO,
  PaymentMethod,
} from '@invoice-system/shared';

interface PaymentParams {
  id: string;
}

interface InvoiceParams {
  id: string;
}

interface PaymentQuery {
  invoiceId?: string;
  paymentMethod?: PaymentMethod;
  fromDate?: string;
  toDate?: string;
  sortBy?: 'date' | 'amount';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const paymentController = {
  /**
   * GET /api/v1/payments
   * Get all payments with optional filtering
   */
  async getAllPayments(
    request: FastifyRequest<{ Querystring: PaymentQuery }>,
    reply: FastifyReply
  ) {
    const query = {
      ...request.query,
      fromDate: request.query.fromDate ? new Date(request.query.fromDate) : undefined,
      toDate: request.query.toDate ? new Date(request.query.toDate) : undefined,
    };

    const payments = await paymentService.getAllPayments(query);
    return reply.send({
      data: payments,
      total: payments.length,
    });
  },

  /**
   * GET /api/v1/payments/:id
   * Get a single payment by ID
   */
  async getPaymentById(
    request: FastifyRequest<{ Params: PaymentParams }>,
    reply: FastifyReply
  ) {
    const payment = await paymentService.getPaymentById(request.params.id);
    return reply.send({ data: payment });
  },

  /**
   * POST /api/v1/payments
   * Create a new payment (auto-updates invoice status)
   */
  async createPayment(
    request: FastifyRequest<{ Body: CreatePaymentDTO }>,
    reply: FastifyReply
  ) {
    const payment = await paymentService.createPayment(request.body);
    return reply.status(201).send({ data: payment });
  },

  /**
   * PUT /api/v1/payments/:id
   * Update an existing payment (recalculates invoice status)
   */
  async updatePayment(
    request: FastifyRequest<{ Params: PaymentParams; Body: UpdatePaymentDTO }>,
    reply: FastifyReply
  ) {
    const payment = await paymentService.updatePayment(
      request.params.id,
      request.body
    );
    return reply.send({ data: payment });
  },

  /**
   * DELETE /api/v1/payments/:id
   * Delete a payment (recalculates invoice status)
   */
  async deletePayment(
    request: FastifyRequest<{ Params: PaymentParams }>,
    reply: FastifyReply
  ) {
    await paymentService.deletePayment(request.params.id);
    return reply.send({
      message: 'Payment deleted successfully',
      deleted: true,
    });
  },

  /**
   * GET /api/v1/invoices/:id/payments
   * Get all payments for a specific invoice
   */
  async getPaymentsByInvoice(
    request: FastifyRequest<{ Params: InvoiceParams }>,
    reply: FastifyReply
  ) {
    const payments = await paymentService.getPaymentsByInvoice(request.params.id);
    return reply.send({
      data: payments,
      total: payments.length,
    });
  },
};
