import { db } from '../db/client.js';
import type {
  Payment,
  PaymentMethod,
} from '@invoice-system/shared';

interface PaymentQuery {
  invoiceId?: string;
  paymentMethod?: PaymentMethod;
  fromDate?: Date;
  toDate?: Date;
  sortBy?: 'date' | 'amount';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const paymentModel = {
  /**
   * Find all payments with optional filtering
   */
  async findAll(query: PaymentQuery = {}): Promise<Payment[]> {
    let queryBuilder = db('payments')
      .select(
        'payments.*',
        db.raw('json_build_object(\'id\', invoices.id, \'invoiceNumber\', invoices.invoice_number, \'totalCents\', invoices.total_cents) as invoice')
      )
      .leftJoin('invoices', 'payments.invoice_id', 'invoices.id')
      .orderBy('payments.payment_date', 'desc');

    // Apply filters
    if (query.invoiceId) {
      queryBuilder = queryBuilder.where('payments.invoice_id', query.invoiceId);
    }

    if (query.paymentMethod) {
      queryBuilder = queryBuilder.where('payments.payment_method', query.paymentMethod);
    }

    if (query.fromDate) {
      queryBuilder = queryBuilder.where('payments.payment_date', '>=', query.fromDate);
    }

    if (query.toDate) {
      queryBuilder = queryBuilder.where('payments.payment_date', '<=', query.toDate);
    }

    // Apply sorting
    const sortBy = query.sortBy || 'date';
    const order = query.order || 'desc';

    const sortColumn = sortBy === 'date' ? 'payments.payment_date'
      : sortBy === 'amount' ? 'payments.amount_cents'
      : 'payments.payment_date';

    queryBuilder = queryBuilder.orderBy(sortColumn, order);

    // Apply pagination
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const offset = (page - 1) * limit;

    queryBuilder = queryBuilder.limit(limit).offset(offset);

    const rows = await queryBuilder;

    return rows.map((row) => ({
      id: row.id,
      invoiceId: row.invoice_id,
      amountCents: Number(row.amount_cents),
      paymentDate: row.payment_date,
      paymentMethod: row.payment_method,
      referenceNumber: row.reference_number,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      invoice: row.invoice,
    }));
  },

  /**
   * Find a single payment by ID with invoice relation
   */
  async findById(id: string): Promise<Payment | null> {
    const row = await db('payments')
      .select(
        'payments.*',
        db.raw('json_build_object(\'id\', invoices.id, \'invoiceNumber\', invoices.invoice_number, \'totalCents\', invoices.total_cents) as invoice')
      )
      .leftJoin('invoices', 'payments.invoice_id', 'invoices.id')
      .where('payments.id', id)
      .first();

    if (!row) return null;

    return {
      id: row.id,
      invoiceId: row.invoice_id,
      amountCents: Number(row.amount_cents),
      paymentDate: row.payment_date,
      paymentMethod: row.payment_method,
      referenceNumber: row.reference_number,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      invoice: row.invoice,
    };
  },

  /**
   * Find all payments for a specific invoice
   */
  async findByInvoice(invoiceId: string): Promise<Payment[]> {
    return this.findAll({ invoiceId });
  },

  /**
   * Calculate total payments for an invoice
   */
  async getTotalPaidForInvoice(invoiceId: string): Promise<number> {
    const result = await db('payments')
      .where({ invoice_id: invoiceId })
      .sum('amount_cents as total')
      .first();

    return Number(result?.total || 0);
  },

  /**
   * Create a new payment
   */
  async create(data: {
    invoiceId: string;
    amountCents: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    notes?: string;
  }): Promise<Payment> {
    const [row] = await db('payments')
      .insert({
        invoice_id: data.invoiceId,
        amount_cents: data.amountCents,
        payment_date: data.paymentDate,
        payment_method: data.paymentMethod,
        reference_number: data.referenceNumber || null,
        notes: data.notes || null,
      })
      .returning('*');

    // Fetch the created payment with full data
    const created = await this.findById(row.id);
    if (!created) {
      throw new Error('Failed to create payment');
    }

    return created;
  },

  /**
   * Update a payment
   */
  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    const updateData: Record<string, any> = {
      updated_at: db.fn.now(),
    };

    if (data.amountCents !== undefined) updateData.amount_cents = data.amountCents;
    if (data.paymentDate !== undefined) updateData.payment_date = data.paymentDate;
    if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod;
    if (data.referenceNumber !== undefined) updateData.reference_number = data.referenceNumber;
    if (data.notes !== undefined) updateData.notes = data.notes;

    await db('payments').where({ id }).update(updateData);

    const payment = await this.findById(id);
    if (!payment) {
      throw new Error('Payment not found after update');
    }

    return payment;
  },

  /**
   * Delete a payment
   */
  async delete(id: string): Promise<void> {
    await db('payments').where({ id }).del();
  },
};
