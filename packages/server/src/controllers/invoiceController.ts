import { FastifyRequest, FastifyReply } from 'fastify';
import * as fs from 'fs';
import { invoiceService } from '../services/invoiceService.js';
import { pdfService } from '../services/pdfService.js';
import type {
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  ConvertSessionsToInvoiceDTO,
  InvoiceStatus,
  CreateInvoiceItemDTO,
  UpdateInvoiceItemDTO,
} from '@invoice-system/shared';

interface InvoiceParams {
  id: string;
}

interface InvoiceItemParams {
  invoiceId: string;
  itemId: string;
}

interface UpdateStatusBody {
  status: InvoiceStatus;
}

interface InvoiceQuery {
  clientId?: string;
  status?: InvoiceStatus;
  search?: string;
  fromDate?: string;
  toDate?: string;
  dateType?: 'issue_date' | 'due_date';
  sortBy?: 'date' | 'amount' | 'due_date';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const invoiceController = {
  /**
   * GET /api/v1/invoices
   * Get all invoices with optional filtering
   */
  async getAllInvoices(
    request: FastifyRequest<{ Querystring: InvoiceQuery }>,
    reply: FastifyReply
  ) {
    const query = {
      ...request.query,
      fromDate: request.query.fromDate ? new Date(request.query.fromDate) : undefined,
      toDate: request.query.toDate ? new Date(request.query.toDate) : undefined,
    };

    const invoices = await invoiceService.getAllInvoices(query);
    return reply.send({
      data: invoices,
      total: invoices.length,
    });
  },

  /**
   * GET /api/v1/invoices/:id
   * Get a single invoice by ID
   */
  async getInvoiceById(
    request: FastifyRequest<{ Params: InvoiceParams }>,
    reply: FastifyReply
  ) {
    const invoice = await invoiceService.getInvoiceById(request.params.id);
    return reply.send({ data: invoice });
  },

  /**
   * POST /api/v1/invoices
   * Create a new invoice manually
   */
  async createInvoice(
    request: FastifyRequest<{ Body: CreateInvoiceDTO }>,
    reply: FastifyReply
  ) {
    const invoice = await invoiceService.createInvoice(request.body);
    return reply.status(201).send({ data: invoice });
  },

  /**
   * POST /api/v1/invoices/from-sessions
   * Create invoice from time sessions
   */
  async createInvoiceFromSessions(
    request: FastifyRequest<{ Body: ConvertSessionsToInvoiceDTO }>,
    reply: FastifyReply
  ) {
    const invoice = await invoiceService.createInvoiceFromSessions(request.body);
    return reply.status(201).send({ data: invoice });
  },

  /**
   * PUT /api/v1/invoices/:id
   * Update an existing invoice
   */
  async updateInvoice(
    request: FastifyRequest<{ Params: InvoiceParams; Body: UpdateInvoiceDTO }>,
    reply: FastifyReply
  ) {
    const invoice = await invoiceService.updateInvoice(
      request.params.id,
      request.body
    );
    return reply.send({ data: invoice });
  },

  /**
   * DELETE /api/v1/invoices/:id
   * Delete an invoice
   */
  async deleteInvoice(
    request: FastifyRequest<{ Params: InvoiceParams }>,
    reply: FastifyReply
  ) {
    await invoiceService.deleteInvoice(request.params.id);
    return reply.send({
      message: 'Invoice deleted successfully',
      deleted: true,
    });
  },

  /**
   * PATCH /api/v1/invoices/:id/status
   * Update invoice status
   */
  async updateInvoiceStatus(
    request: FastifyRequest<{ Params: InvoiceParams; Body: UpdateStatusBody }>,
    reply: FastifyReply
  ) {
    const invoice = await invoiceService.updateInvoiceStatus(
      request.params.id,
      request.body.status
    );
    return reply.send({ data: invoice });
  },

  /**
   * GET /api/v1/clients/:id/invoices
   * Get all invoices for a specific client
   */
  async getInvoicesByClient(
    request: FastifyRequest<{ Params: InvoiceParams }>,
    reply: FastifyReply
  ) {
    const invoices = await invoiceService.getInvoicesByClient(request.params.id);
    return reply.send({
      data: invoices,
      total: invoices.length,
    });
  },

  /**
   * POST /api/v1/invoices/:id/items
   * Add a line item to an invoice
   */
  async addInvoiceItem(
    request: FastifyRequest<{ Params: InvoiceParams; Body: CreateInvoiceItemDTO }>,
    reply: FastifyReply
  ) {
    const invoice = await invoiceService.addInvoiceItem(
      request.params.id,
      request.body
    );
    return reply.status(201).send({ data: invoice });
  },

  /**
   * PUT /api/v1/invoices/:invoiceId/items/:itemId
   * Update an invoice line item
   */
  async updateInvoiceItem(
    request: FastifyRequest<{ Params: InvoiceItemParams; Body: UpdateInvoiceItemDTO }>,
    reply: FastifyReply
  ) {
    const invoice = await invoiceService.updateInvoiceItem(
      request.params.invoiceId,
      request.params.itemId,
      request.body
    );
    return reply.send({ data: invoice });
  },

  /**
   * DELETE /api/v1/invoices/:invoiceId/items/:itemId
   * Delete an invoice line item
   */
  async deleteInvoiceItem(
    request: FastifyRequest<{ Params: InvoiceItemParams }>,
    reply: FastifyReply
  ) {
    const invoice = await invoiceService.deleteInvoiceItem(
      request.params.invoiceId,
      request.params.itemId
    );
    return reply.send({ data: invoice });
  },

  /**
   * POST /api/v1/invoices/:id/generate-pdf
   * Generate or regenerate PDF for an invoice
   */
  async generateInvoicePDF(
    request: FastifyRequest<{ Params: InvoiceParams }>,
    reply: FastifyReply
  ) {
    const invoice = await pdfService.generateInvoicePDF(request.params.id);
    return reply.send({
      data: invoice,
      message: 'PDF generated successfully',
    });
  },

  /**
   * GET /api/v1/invoices/:id/pdf
   * Download or view the invoice PDF
   */
  async getInvoicePDF(
    request: FastifyRequest<{ Params: InvoiceParams }>,
    reply: FastifyReply
  ) {
    const filePath = await pdfService.getInvoicePDFPath(request.params.id);
    const invoice = await invoiceService.getInvoiceById(request.params.id);

    // Set headers for PDF download
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);

    // Stream the file
    const stream = fs.createReadStream(filePath);
    return reply.send(stream);
  },
};
