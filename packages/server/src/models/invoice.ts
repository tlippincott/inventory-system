import { db } from '../db/client.js';
import type {
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  CreateInvoiceItemDTO,
  UpdateInvoiceItemDTO,
} from '@invoice-system/shared';

interface InvoiceQuery {
  clientId?: string;
  status?: InvoiceStatus;
  fromDate?: Date;
  toDate?: Date;
  sortBy?: 'date' | 'amount' | 'due_date';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const invoiceModel = {
  /**
   * Find all invoices with optional filtering
   */
  async findAll(query: InvoiceQuery = {}): Promise<Invoice[]> {
    let queryBuilder = db('invoices')
      .select(
        'invoices.*',
        db.raw('json_build_object(\'id\', clients.id, \'name\', clients.name, \'companyName\', clients.company_name, \'email\', clients.email) as client')
      )
      .leftJoin('clients', 'invoices.client_id', 'clients.id')
      .orderBy('invoices.created_at', 'desc');

    // Apply filters
    if (query.clientId) {
      queryBuilder = queryBuilder.where('invoices.client_id', query.clientId);
    }

    if (query.status) {
      queryBuilder = queryBuilder.where('invoices.status', query.status);
    }

    if (query.fromDate) {
      queryBuilder = queryBuilder.where('invoices.issue_date', '>=', query.fromDate);
    }

    if (query.toDate) {
      queryBuilder = queryBuilder.where('invoices.issue_date', '<=', query.toDate);
    }

    // Apply sorting
    const sortBy = query.sortBy || 'date';
    const order = query.order || 'desc';

    const sortColumn = sortBy === 'date' ? 'invoices.issue_date'
      : sortBy === 'due_date' ? 'invoices.due_date'
      : sortBy === 'amount' ? 'invoices.total_cents'
      : 'invoices.issue_date';

    queryBuilder = queryBuilder.orderBy(sortColumn, order);

    // Apply pagination
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const offset = (page - 1) * limit;

    queryBuilder = queryBuilder.limit(limit).offset(offset);

    const rows = await queryBuilder;

    // Fetch items for each invoice
    const invoicesWithItems = await Promise.all(
      rows.map(async (row) => {
        const items = await this.findItemsByInvoice(row.id);
        return {
          id: row.id,
          invoiceNumber: row.invoice_number,
          clientId: row.client_id,
          issueDate: row.issue_date,
          dueDate: row.due_date,
          status: row.status,
          subtotalCents: Number(row.subtotal_cents),
          taxRate: Number(row.tax_rate),
          taxAmountCents: Number(row.tax_amount_cents),
          totalCents: Number(row.total_cents),
          currency: row.currency,
          notes: row.notes,
          terms: row.terms,
          pdfPath: row.pdf_path,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          client: row.client,
          items,
        };
      })
    );

    return invoicesWithItems;
  },

  /**
   * Find a single invoice by ID with items and client
   */
  async findById(id: string): Promise<Invoice | null> {
    const row = await db('invoices')
      .select(
        'invoices.*',
        db.raw('json_build_object(\'id\', clients.id, \'name\', clients.name, \'companyName\', clients.company_name, \'email\', clients.email) as client')
      )
      .leftJoin('clients', 'invoices.client_id', 'clients.id')
      .where('invoices.id', id)
      .first();

    if (!row) return null;

    const items = await this.findItemsByInvoice(id);

    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      clientId: row.client_id,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      status: row.status,
      subtotalCents: Number(row.subtotal_cents),
      taxRate: Number(row.tax_rate),
      taxAmountCents: Number(row.tax_amount_cents),
      totalCents: Number(row.total_cents),
      currency: row.currency,
      notes: row.notes,
      terms: row.terms,
      pdfPath: row.pdf_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      client: row.client,
      items,
    };
  },

  /**
   * Find all invoices for a specific client
   */
  async findByClient(clientId: string): Promise<Invoice[]> {
    return this.findAll({ clientId });
  },

  /**
   * Generate next invoice number atomically
   */
  async generateInvoiceNumber(): Promise<string> {
    // Get or create user settings
    let settings = await db('user_settings').first();

    if (!settings) {
      // Create default settings if none exist
      [settings] = await db('user_settings')
        .insert({
          business_name: 'My Business',
          invoice_prefix: 'INV-',
          next_invoice_number: 1,
        })
        .returning('*');
    }

    // Atomically increment and get the invoice number
    const [updated] = await db('user_settings')
      .update({
        next_invoice_number: db.raw('next_invoice_number + 1'),
        updated_at: db.fn.now(),
      })
      .returning(['invoice_prefix', 'next_invoice_number']);

    const invoiceNumber = updated.next_invoice_number - 1; // We want the number before increment
    const prefix = updated.invoice_prefix;

    // Pad the number to 4 digits
    const paddedNumber = invoiceNumber.toString().padStart(4, '0');

    return `${prefix}${paddedNumber}`;
  },

  /**
   * Create a new invoice with items
   */
  async create(data: {
    clientId: string;
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date;
    taxRate: number;
    currency: string;
    notes?: string;
    terms?: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPriceCents: number;
      totalCents: number;
      position: number;
    }>;
    subtotalCents: number;
    taxAmountCents: number;
    totalCents: number;
  }): Promise<Invoice> {
    // Start a transaction
    return await db.transaction(async (trx) => {
      // Create invoice
      const [invoice] = await trx('invoices')
        .insert({
          client_id: data.clientId,
          invoice_number: data.invoiceNumber,
          issue_date: data.issueDate,
          due_date: data.dueDate,
          tax_rate: data.taxRate,
          subtotal_cents: data.subtotalCents,
          tax_amount_cents: data.taxAmountCents,
          total_cents: data.totalCents,
          currency: data.currency,
          notes: data.notes || null,
          terms: data.terms || null,
          status: 'draft',
        })
        .returning('*');

      // Create invoice items
      const itemsToInsert = data.items.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price_cents: item.unitPriceCents,
        total_cents: item.totalCents,
        position: item.position,
      }));

      await trx('invoice_items').insert(itemsToInsert);

      // Fetch the created invoice with full data using the original db connection
      const created = await this.findById(invoice.id);
      if (!created) {
        throw new Error('Failed to create invoice');
      }

      return created;
    });
  },

  /**
   * Update an invoice
   */
  async update(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const updateData: Record<string, any> = {
      updated_at: db.fn.now(),
    };

    if (data.issueDate !== undefined) updateData.issue_date = data.issueDate;
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
    if (data.taxRate !== undefined) updateData.tax_rate = data.taxRate;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.terms !== undefined) updateData.terms = data.terms;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.subtotalCents !== undefined) updateData.subtotal_cents = data.subtotalCents;
    if (data.taxAmountCents !== undefined) updateData.tax_amount_cents = data.taxAmountCents;
    if (data.totalCents !== undefined) updateData.total_cents = data.totalCents;
    if (data.pdfPath !== undefined) updateData.pdf_path = data.pdfPath;

    await db('invoices').where({ id }).update(updateData);

    const invoice = await this.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found after update');
    }

    return invoice;
  },

  /**
   * Delete an invoice (CASCADE deletes items)
   */
  async delete(id: string): Promise<void> {
    await db('invoices').where({ id }).del();
  },

  /**
   * Update invoice status
   */
  async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    await db('invoices')
      .where({ id })
      .update({
        status,
        updated_at: db.fn.now(),
      });

    const invoice = await this.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found after status update');
    }

    return invoice;
  },

  /**
   * Calculate and update invoice totals from items
   */
  async calculateTotals(invoiceId: string): Promise<void> {
    const items = await this.findItemsByInvoice(invoiceId);

    const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);

    const invoice = await this.findById(invoiceId);
    if (!invoice) return;

    const taxAmountCents = Math.round(subtotalCents * (invoice.taxRate / 100));
    const totalCents = subtotalCents + taxAmountCents;

    await db('invoices')
      .where({ id: invoiceId })
      .update({
        subtotal_cents: subtotalCents,
        tax_amount_cents: taxAmountCents,
        total_cents: totalCents,
        updated_at: db.fn.now(),
      });
  },

  // ===== INVOICE ITEMS METHODS =====

  /**
   * Find all items for an invoice
   */
  async findItemsByInvoice(invoiceId: string): Promise<InvoiceItem[]> {
    const rows = await db('invoice_items')
      .where({ invoice_id: invoiceId })
      .orderBy('position', 'asc');

    return rows.map((row) => ({
      id: row.id,
      invoiceId: row.invoice_id,
      description: row.description,
      quantity: Number(row.quantity),
      unitPriceCents: Number(row.unit_price_cents),
      totalCents: Number(row.total_cents),
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  /**
   * Find a single invoice item
   */
  async findItemById(invoiceId: string, itemId: string): Promise<InvoiceItem | null> {
    const row = await db('invoice_items')
      .where({ id: itemId, invoice_id: invoiceId })
      .first();

    if (!row) return null;

    return {
      id: row.id,
      invoiceId: row.invoice_id,
      description: row.description,
      quantity: Number(row.quantity),
      unitPriceCents: Number(row.unit_price_cents),
      totalCents: Number(row.total_cents),
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  /**
   * Create an invoice item
   */
  async createItem(invoiceId: string, data: CreateInvoiceItemDTO & { position: number }): Promise<InvoiceItem> {
    const totalCents = Math.round(data.quantity * data.unitPriceCents);

    const [row] = await db('invoice_items')
      .insert({
        invoice_id: invoiceId,
        description: data.description,
        quantity: data.quantity,
        unit_price_cents: data.unitPriceCents,
        total_cents: totalCents,
        position: data.position,
      })
      .returning('*');

    return {
      id: row.id,
      invoiceId: row.invoice_id,
      description: row.description,
      quantity: Number(row.quantity),
      unitPriceCents: Number(row.unit_price_cents),
      totalCents: Number(row.total_cents),
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  /**
   * Update an invoice item
   */
  async updateItem(invoiceId: string, itemId: string, data: UpdateInvoiceItemDTO): Promise<InvoiceItem> {
    const updateData: Record<string, any> = {
      updated_at: db.fn.now(),
    };

    if (data.description !== undefined) updateData.description = data.description;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unitPriceCents !== undefined) updateData.unit_price_cents = data.unitPriceCents;

    // Recalculate total if quantity or price changed
    if (data.quantity !== undefined || data.unitPriceCents !== undefined) {
      const item = await this.findItemById(invoiceId, itemId);
      if (item) {
        const newQuantity = data.quantity !== undefined ? data.quantity : item.quantity;
        const newUnitPrice = data.unitPriceCents !== undefined ? data.unitPriceCents : item.unitPriceCents;
        updateData.total_cents = Math.round(newQuantity * newUnitPrice);
      }
    }

    await db('invoice_items')
      .where({ id: itemId, invoice_id: invoiceId })
      .update(updateData);

    const item = await this.findItemById(invoiceId, itemId);
    if (!item) {
      throw new Error('Invoice item not found after update');
    }

    return item;
  },

  /**
   * Delete an invoice item
   */
  async deleteItem(invoiceId: string, itemId: string): Promise<void> {
    await db('invoice_items')
      .where({ id: itemId, invoice_id: invoiceId })
      .del();
  },

  /**
   * Get the count of items for an invoice
   */
  async getItemCount(invoiceId: string): Promise<number> {
    const result = await db('invoice_items')
      .where({ invoice_id: invoiceId })
      .count('* as count')
      .first();

    return Number(result?.count || 0);
  },
};
