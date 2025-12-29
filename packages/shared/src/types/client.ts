export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;

  // Billing address
  billingAddressLine1: string | null;
  billingAddressLine2: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;

  // Payment terms
  defaultPaymentTerms: number; // days
  defaultCurrency: string;

  // Tax info
  taxId: string | null;

  notes: string | null;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientDTO {
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;

  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  defaultPaymentTerms?: number;
  defaultCurrency?: string;

  taxId?: string;
  notes?: string;
}

export interface UpdateClientDTO extends Partial<CreateClientDTO> {
  isActive?: boolean;
}
