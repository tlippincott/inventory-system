export type PaymentMethod = 'bank_transfer' | 'check' | 'cash' | 'credit_card' | 'other';

export interface Payment {
  id: string;
  invoiceId: string;

  amountCents: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;

  referenceNumber: string | null;
  notes: string | null;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalCents: number;
  };
}

export interface CreatePaymentDTO {
  invoiceId: string;
  amountCents: number;
  paymentDate: Date | string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export interface UpdatePaymentDTO extends Partial<CreatePaymentDTO> {}
