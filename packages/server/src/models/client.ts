import { db } from '../db/client.js';
import type {
  Client,
  CreateClientDTO,
  UpdateClientDTO,
  ClientQuery,
  ClientStats
} from '@invoice-system/shared';

export const clientModel = {
  /**
   * Find all clients with optional filtering and search
   */
  async findAll(query: ClientQuery = {}): Promise<Client[]> {
    let queryBuilder = db('clients')
      .select('*')
      .orderBy('created_at', 'desc');

    // Apply filters
    if (query.isActive !== undefined) {
      queryBuilder = queryBuilder.where('is_active', query.isActive);
    }

    if (query.search) {
      const searchTerm = `%${query.search}%`;
      queryBuilder = queryBuilder.where((builder) => {
        builder
          .whereILike('name', searchTerm)
          .orWhereILike('email', searchTerm)
          .orWhereILike('company_name', searchTerm);
      });
    }

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;

    queryBuilder = queryBuilder.limit(limit).offset(offset);

    const rows = await queryBuilder;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      companyName: row.company_name,
      billingAddressLine1: row.billing_address_line1,
      billingAddressLine2: row.billing_address_line2,
      billingCity: row.billing_city,
      billingState: row.billing_state,
      billingPostalCode: row.billing_postal_code,
      billingCountry: row.billing_country,
      defaultPaymentTerms: row.default_payment_terms,
      defaultCurrency: row.default_currency,
      taxId: row.tax_id,
      notes: row.notes,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  /**
   * Find a single client by ID
   */
  async findById(id: string): Promise<Client | null> {
    const row = await db('clients')
      .where({ id })
      .first();

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      companyName: row.company_name,
      billingAddressLine1: row.billing_address_line1,
      billingAddressLine2: row.billing_address_line2,
      billingCity: row.billing_city,
      billingState: row.billing_state,
      billingPostalCode: row.billing_postal_code,
      billingCountry: row.billing_country,
      defaultPaymentTerms: row.default_payment_terms,
      defaultCurrency: row.default_currency,
      taxId: row.tax_id,
      notes: row.notes,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  /**
   * Find a client by email (for uniqueness check)
   */
  async findByEmail(email: string): Promise<Client | null> {
    const row = await db('clients')
      .whereILike('email', email)
      .first();

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      companyName: row.company_name,
      billingAddressLine1: row.billing_address_line1,
      billingAddressLine2: row.billing_address_line2,
      billingCity: row.billing_city,
      billingState: row.billing_state,
      billingPostalCode: row.billing_postal_code,
      billingCountry: row.billing_country,
      defaultPaymentTerms: row.default_payment_terms,
      defaultCurrency: row.default_currency,
      taxId: row.tax_id,
      notes: row.notes,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  /**
   * Create a new client
   */
  async create(data: CreateClientDTO): Promise<Client> {
    const [row] = await db('clients')
      .insert({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company_name: data.companyName || null,
        billing_address_line1: data.billingAddressLine1 || null,
        billing_address_line2: data.billingAddressLine2 || null,
        billing_city: data.billingCity || null,
        billing_state: data.billingState || null,
        billing_postal_code: data.billingPostalCode || null,
        billing_country: data.billingCountry || null,
        default_payment_terms: data.defaultPaymentTerms ?? 30,
        default_currency: data.defaultCurrency || 'USD',
        tax_id: data.taxId || null,
        notes: data.notes || null,
        is_active: true,
      })
      .returning('*');

    const client = await this.findById(row.id);
    if (!client) {
      throw new Error('Failed to create client');
    }

    return client;
  },

  /**
   * Update an existing client
   */
  async update(id: string, data: UpdateClientDTO): Promise<Client> {
    const updateData: Record<string, any> = {
      updated_at: db.fn.now(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.companyName !== undefined) updateData.company_name = data.companyName;
    if (data.billingAddressLine1 !== undefined) updateData.billing_address_line1 = data.billingAddressLine1;
    if (data.billingAddressLine2 !== undefined) updateData.billing_address_line2 = data.billingAddressLine2;
    if (data.billingCity !== undefined) updateData.billing_city = data.billingCity;
    if (data.billingState !== undefined) updateData.billing_state = data.billingState;
    if (data.billingPostalCode !== undefined) updateData.billing_postal_code = data.billingPostalCode;
    if (data.billingCountry !== undefined) updateData.billing_country = data.billingCountry;
    if (data.defaultPaymentTerms !== undefined) updateData.default_payment_terms = data.defaultPaymentTerms;
    if (data.defaultCurrency !== undefined) updateData.default_currency = data.defaultCurrency;
    if (data.taxId !== undefined) updateData.tax_id = data.taxId;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    await db('clients')
      .where({ id })
      .update(updateData);

    const client = await this.findById(id);
    if (!client) {
      throw new Error('Client not found after update');
    }

    return client;
  },

  /**
   * Delete a client (soft delete if has invoices, hard delete otherwise)
   */
  async delete(id: string): Promise<void> {
    // Check if client has invoices
    const invoiceCount = await db('invoices')
      .where({ client_id: id })
      .count('* as count')
      .first();

    if (invoiceCount && Number(invoiceCount.count) > 0) {
      // Soft delete: deactivate the client
      await db('clients')
        .where({ id })
        .update({
          is_active: false,
          updated_at: db.fn.now(),
        });
    } else {
      // Hard delete: no invoices exist
      await db('clients').where({ id }).del();
    }
  },

  /**
   * Get statistics for a client (invoice counts and amounts)
   */
  async getStatistics(id: string): Promise<ClientStats> {
    const result = await db('invoices')
      .where({ client_id: id })
      .select(
        db.raw('COUNT(*) as invoice_count'),
        db.raw(`COALESCE(SUM(CASE WHEN status = 'paid' THEN total_cents ELSE 0 END), 0) as total_revenue_cents`),
        db.raw(`COALESCE(SUM(CASE WHEN status IN ('sent', 'overdue') THEN total_cents ELSE 0 END), 0) as outstanding_balance_cents`),
        db.raw(`COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoice_count`),
        db.raw(`COUNT(CASE WHEN status IN ('draft', 'sent', 'overdue') THEN 1 END) as unpaid_invoice_count`)
      )
      .first();

    return {
      invoiceCount: Number(result?.invoice_count || 0),
      totalRevenueCents: Number(result?.total_revenue_cents || 0),
      outstandingBalanceCents: Number(result?.outstanding_balance_cents || 0),
      paidInvoiceCount: Number(result?.paid_invoice_count || 0),
      unpaidInvoiceCount: Number(result?.unpaid_invoice_count || 0),
    };
  },
};
