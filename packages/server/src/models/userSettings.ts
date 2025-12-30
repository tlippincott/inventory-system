import { db } from '../db/client.js';
import type { UserSettings } from '@invoice-system/shared';

export const userSettingsModel = {
  /**
   * Find existing settings or create with defaults
   * Returns the single user_settings record, creating it if it doesn't exist
   */
  async findOrCreate(): Promise<UserSettings> {
    let row = await db('user_settings').first();

    if (!row) {
      // Create default settings if none exist
      [row] = await db('user_settings')
        .insert({
          business_name: 'My Business',
          default_payment_terms: 30,
          default_currency: 'USD',
          default_tax_rate: 0,
          invoice_prefix: 'INV-',
          next_invoice_number: 1,
        })
        .returning('*');
    }

    return this.mapToUserSettings(row);
  },

  /**
   * Update user settings (partial update)
   * No ID parameter needed - always updates the single row
   */
  async update(data: Partial<UserSettings>): Promise<UserSettings> {
    const updateData: Record<string, any> = {
      updated_at: db.fn.now(),
    };

    // Map camelCase to snake_case for each provided field
    if (data.businessName !== undefined) updateData.business_name = data.businessName;
    if (data.ownerName !== undefined) updateData.owner_name = data.ownerName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.addressLine1 !== undefined) updateData.address_line1 = data.addressLine1;
    if (data.addressLine2 !== undefined) updateData.address_line2 = data.addressLine2;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.postalCode !== undefined) updateData.postal_code = data.postalCode;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.taxId !== undefined) updateData.tax_id = data.taxId;
    if (data.defaultPaymentTerms !== undefined) updateData.default_payment_terms = data.defaultPaymentTerms;
    if (data.defaultCurrency !== undefined) updateData.default_currency = data.defaultCurrency;
    if (data.defaultTaxRate !== undefined) updateData.default_tax_rate = data.defaultTaxRate;
    if (data.invoicePrefix !== undefined) updateData.invoice_prefix = data.invoicePrefix;
    if (data.logoPath !== undefined) updateData.logo_path = data.logoPath;

    // Update the single row and return
    const [row] = await db('user_settings')
      .update(updateData)
      .returning('*');

    return this.mapToUserSettings(row);
  },

  /**
   * Helper to map database row to UserSettings type
   * Converts snake_case to camelCase
   */
  mapToUserSettings(row: any): UserSettings {
    return {
      id: row.id,
      businessName: row.business_name,
      ownerName: row.owner_name,
      email: row.email,
      phone: row.phone,
      addressLine1: row.address_line1,
      addressLine2: row.address_line2,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
      taxId: row.tax_id,
      defaultPaymentTerms: Number(row.default_payment_terms),
      defaultCurrency: row.default_currency,
      defaultTaxRate: Number(row.default_tax_rate),
      invoicePrefix: row.invoice_prefix,
      nextInvoiceNumber: Number(row.next_invoice_number),
      logoPath: row.logo_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};
