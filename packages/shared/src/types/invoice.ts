export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;

  issueDate: Date;
  dueDate: Date;
  servicePeriodEndDate: Date | null;

  status: InvoiceStatus;

  subtotalCents: number;
  taxRate: number;
  taxAmountCents: number;
  totalCents: number;

  currency: string;

  notes: string | null;
  terms: string | null;

  pdfPath: string | null;

  createdAt: Date;
  updatedAt: Date;

  // Relations (populated when fetched with items/client)
  items?: InvoiceItem[];
  client?: {
    id: string;
    name: string;
    email: string | null;
  };
}

export interface CreateInvoiceItemDTO {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export interface CreateInvoiceDTO {
  clientId: string;
  issueDate: Date | string;
  dueDate: Date | string;
  servicePeriodEndDate?: Date | string;
  taxRate?: number;
  currency?: string;
  notes?: string;
  terms?: string;
  items: CreateInvoiceItemDTO[];
}

export interface UpdateInvoiceDTO extends Partial<Omit<CreateInvoiceDTO, 'items'>> {
  status?: InvoiceStatus;
}

export interface UpdateInvoiceItemDTO {
  description?: string;
  quantity?: number;
  unitPriceCents?: number;
}

// Helper type for invoice with client details
export interface InvoiceWithClient extends Invoice {
  client: {
    id: string;
    name: string;
    email: string | null;
    companyName: string | null;
    billingAddressLine1: string | null;
    billingAddressLine2: string | null;
    billingCity: string | null;
    billingState: string | null;
    billingPostalCode: string | null;
    billingCountry: string | null;
  };
  items: InvoiceItem[];
}
