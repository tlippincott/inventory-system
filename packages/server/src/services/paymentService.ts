import { paymentModel } from '../models/payment.js';
import { invoiceModel } from '../models/invoice.js';
import {
  createPaymentSchema,
  updatePaymentSchema,
} from '@invoice-system/shared';
import type {
  Payment,
  CreatePaymentDTO,
  UpdatePaymentDTO,
  InvoiceStatus,
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

export const paymentService = {
  /**
   * Get all payments with optional filtering
   */
  async getAllPayments(query: unknown): Promise<Payment[]> {
    // Validate query parameters
    const validatedQuery = query as any;

    // Fetch payments from model
    return await paymentModel.findAll(validatedQuery);
  },

  /**
   * Get a single payment by ID
   */
  async getPaymentById(id: string): Promise<Payment> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid payment ID');
    }

    const payment = await paymentModel.findById(id);

    if (!payment) {
      throw new NotFoundError(`Payment with ID ${id} not found`);
    }

    return payment;
  },

  /**
   * Get all payments for a specific invoice
   */
  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    // Validate invoice exists
    const invoice = await invoiceModel.findById(invoiceId);
    if (!invoice) {
      throw new NotFoundError(`Invoice with ID ${invoiceId} not found`);
    }

    return await paymentModel.findByInvoice(invoiceId);
  },

  /**
   * Create a new payment with invoice status auto-update
   */
  async createPayment(data: unknown): Promise<Payment> {
    // Validate input data
    const validatedData = createPaymentSchema.parse(data) as CreatePaymentDTO;

    // Verify invoice exists
    const invoice = await invoiceModel.findById(validatedData.invoiceId);
    if (!invoice) {
      throw new NotFoundError(`Invoice with ID ${validatedData.invoiceId} not found`);
    }

    // Prevent payments to cancelled invoices
    if (invoice.status === 'cancelled') {
      throw new BadRequestError('Cannot add payments to cancelled invoices');
    }

    // Calculate current total paid
    const currentTotalPaid = await paymentModel.getTotalPaidForInvoice(invoice.id);

    // Prevent overpayment
    const newTotalPaid = currentTotalPaid + validatedData.amountCents;
    if (newTotalPaid > invoice.totalCents) {
      const outstanding = invoice.totalCents - currentTotalPaid;
      throw new BadRequestError(
        `Payment amount of $${(validatedData.amountCents / 100).toFixed(2)} would exceed invoice total. ` +
        `Outstanding balance: $${(outstanding / 100).toFixed(2)}. ` +
        `Invoice total: $${(invoice.totalCents / 100).toFixed(2)}, Already paid: $${(currentTotalPaid / 100).toFixed(2)}`
      );
    }

    // Create payment
    const payment = await paymentModel.create({
      invoiceId: validatedData.invoiceId,
      amountCents: validatedData.amountCents,
      paymentDate: new Date(validatedData.paymentDate),
      paymentMethod: validatedData.paymentMethod,
      referenceNumber: validatedData.referenceNumber,
      notes: validatedData.notes,
    });

    // Auto-update invoice status
    await this.updateInvoiceStatusAfterPayment(invoice.id, newTotalPaid, invoice.totalCents);

    return payment;
  },

  /**
   * Update an existing payment with invoice status recalculation
   */
  async updatePayment(id: string, data: unknown): Promise<Payment> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid payment ID');
    }

    // Validate input data
    const validatedData = updatePaymentSchema.parse(data) as UpdatePaymentDTO;

    // Check if payment exists
    const existingPayment = await paymentModel.findById(id);
    if (!existingPayment) {
      throw new NotFoundError(`Payment with ID ${id} not found`);
    }

    // Get the invoice
    const invoice = await invoiceModel.findById(existingPayment.invoiceId);
    if (!invoice) {
      throw new NotFoundError(`Invoice with ID ${existingPayment.invoiceId} not found`);
    }

    // Calculate totals if amount is changing
    let newTotalPaid = 0;
    if (validatedData.amountCents !== undefined && validatedData.amountCents !== existingPayment.amountCents) {
      const currentTotalPaid = await paymentModel.getTotalPaidForInvoice(invoice.id);
      newTotalPaid = currentTotalPaid - existingPayment.amountCents + validatedData.amountCents;

      // Prevent overpayment
      if (newTotalPaid > invoice.totalCents) {
        const outstanding = invoice.totalCents - (currentTotalPaid - existingPayment.amountCents);
        throw new BadRequestError(
          `Updated payment amount of $${(validatedData.amountCents / 100).toFixed(2)} would exceed invoice total. ` +
          `Outstanding balance: $${(outstanding / 100).toFixed(2)}`
        );
      }
    }

    // Prepare update data
    const updateData: Partial<Payment> = {};
    if (validatedData.amountCents !== undefined) {
      updateData.amountCents = validatedData.amountCents;
    }
    if (validatedData.paymentDate !== undefined) {
      updateData.paymentDate = new Date(validatedData.paymentDate);
    }
    if (validatedData.paymentMethod !== undefined) {
      updateData.paymentMethod = validatedData.paymentMethod;
    }
    if (validatedData.referenceNumber !== undefined) {
      updateData.referenceNumber = validatedData.referenceNumber;
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    // Update payment
    const updated = await paymentModel.update(id, updateData);

    // Recalculate invoice status if amount changed
    if (validatedData.amountCents !== undefined && validatedData.amountCents !== existingPayment.amountCents) {
      await this.updateInvoiceStatusAfterPayment(invoice.id, newTotalPaid, invoice.totalCents);
    }

    return updated;
  },

  /**
   * Delete a payment with invoice status recalculation
   */
  async deletePayment(id: string): Promise<void> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid payment ID');
    }

    // Check if payment exists
    const existingPayment = await paymentModel.findById(id);
    if (!existingPayment) {
      throw new NotFoundError(`Payment with ID ${id} not found`);
    }

    // Get the invoice
    const invoice = await invoiceModel.findById(existingPayment.invoiceId);
    if (!invoice) {
      throw new NotFoundError(`Invoice with ID ${existingPayment.invoiceId} not found`);
    }

    // Delete payment
    await paymentModel.delete(id);

    // Recalculate total paid for the invoice
    const newTotalPaid = await paymentModel.getTotalPaidForInvoice(invoice.id);

    // Update invoice status - revert if necessary
    if (invoice.status === 'paid' && newTotalPaid < invoice.totalCents) {
      // Invoice was fully paid, now it's not
      const newStatus: InvoiceStatus = newTotalPaid > 0 ? 'sent' : 'draft';
      await invoiceModel.updateStatus(invoice.id, newStatus);
    } else {
      // Recalculate status based on new total
      await this.updateInvoiceStatusAfterPayment(invoice.id, newTotalPaid, invoice.totalCents);
    }
  },

  /**
   * Update invoice status based on payment total
   * @private
   */
  async updateInvoiceStatusAfterPayment(
    invoiceId: string,
    totalPaid: number,
    invoiceTotal: number
  ): Promise<void> {
    const invoice = await invoiceModel.findById(invoiceId);
    if (!invoice) return;

    // Don't change status if cancelled
    if (invoice.status === 'cancelled') return;

    let newStatus: InvoiceStatus | null = null;

    if (totalPaid >= invoiceTotal) {
      // Fully paid
      newStatus = 'paid';
    } else if (totalPaid > 0 && invoice.status === 'draft') {
      // Partial payment on draft - move to sent
      newStatus = 'sent';
    }

    // Only update if status needs to change
    if (newStatus && newStatus !== invoice.status) {
      await invoiceModel.updateStatus(invoiceId, newStatus);
    }
  },
};
