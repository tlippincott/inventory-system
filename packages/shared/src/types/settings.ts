export interface UserSettings {
  id: string;
  businessName: string;
  ownerName: string | null;
  email: string | null;
  phone: string | null;

  // Business address
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;

  // Tax/Legal
  taxId: string | null;

  // Invoice defaults
  defaultPaymentTerms: number; // days
  defaultCurrency: string;
  defaultTaxRate: number;

  // Invoice number config
  invoicePrefix: string;
  nextInvoiceNumber: number;

  // Logo
  logoPath: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserSettingsDTO {
  businessName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;

  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;

  taxId?: string;

  defaultPaymentTerms?: number;
  defaultCurrency?: string;
  defaultTaxRate?: number;

  invoicePrefix?: string;
}
