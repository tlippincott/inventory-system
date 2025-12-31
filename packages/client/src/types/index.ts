// Re-export most types from shared package
export type {
  Client,
  CreateClientDTO,
  UpdateClientDTO,
  ClientQuery,
  ClientStats,
  Project,
  CreateProjectDTO,
  UpdateProjectDTO,
  TimeSession,
  TimeSessionStatus,
  StartTimeSessionDTO,
  UpdateTimeSessionDTO,
  TimeSessionQuery,
  ProjectQuery,
  Invoice,
  InvoiceStatus,
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  InvoiceItem,
  Payment,
  CreatePaymentDTO,
  UserSettings,
  UpdateUserSettingsDTO,
} from '@invoice-system/shared';

// Export UI-specific types
export * from './ui';
