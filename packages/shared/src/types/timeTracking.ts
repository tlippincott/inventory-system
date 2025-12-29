export type TimeSessionStatus = 'running' | 'paused' | 'stopped';

// Project
export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  defaultHourlyRateCents: number;
  color: string | null;
  isActive: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations (populated when fetched)
  client?: {
    id: string;
    name: string;
    companyName: string | null;
  };
  activeSessions?: number; // Count of unbilled sessions
  totalUnbilledSeconds?: number; // Total unbilled time
}

// Time Session
export interface TimeSession {
  id: string;
  projectId: string;
  clientId: string;
  taskDescription: string;

  startTime: Date;
  endTime: Date | null;
  durationSeconds: number | null;

  status: TimeSessionStatus;

  hourlyRateCents: number;
  billableAmountCents: number | null;
  isBillable: boolean;
  invoiceItemId: string | null;
  billedAt: Date | null;

  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations (populated when fetched)
  project?: Project;
  client?: {
    id: string;
    name: string;
    companyName: string | null;
  };
}

// Active Timer Info (for timer widget)
export interface ActiveTimerInfo {
  session: TimeSession;
  project: Project;
  client: {
    id: string;
    name: string;
    companyName: string | null;
  };
  elapsedSeconds: number; // Computed from startTime
}

// Grouped sessions for invoice creation
export interface SessionGroup {
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  sessions: TimeSession[];
  totalDurationSeconds: number;
  totalBillableAmountCents: number;
  averageHourlyRateCents: number;
}

// Project stats
export interface ProjectStats {
  projectId: string;
  totalSessions: number;
  totalDurationSeconds: number;
  unbilledDurationSeconds: number;
  billedDurationSeconds: number;
  unbilledAmountCents: number;
  billedAmountCents: number;
}

// DTOs
export interface CreateProjectDTO {
  clientId: string;
  name: string;
  description?: string;
  defaultHourlyRateCents?: number;
  color?: string;
}

export interface UpdateProjectDTO extends Partial<CreateProjectDTO> {
  isActive?: boolean;
  isArchived?: boolean;
}

export interface StartTimeSessionDTO {
  projectId: string;
  taskDescription: string;
  notes?: string;
  isBillable?: boolean; // Default: true
}

export interface UpdateTimeSessionDTO {
  taskDescription?: string;
  notes?: string;
  isBillable?: boolean;
  hourlyRateCents?: number; // Allow override before billing
  durationSeconds?: number; // For manual adjustments
}

export interface BulkUpdateSessionsDTO {
  sessionIds: string[];
  isBillable?: boolean;
  hourlyRateCents?: number;
}

export interface ConvertSessionsToInvoiceDTO {
  sessionIds: string[];
  clientId: string;
  groupByProject: boolean; // If true, create one line item per project
  issueDate: Date | string;
  dueDate: Date | string;
  taxRate?: number;
  notes?: string;
  terms?: string;
}

export interface TimeSessionQuery {
  clientId?: string;
  projectId?: string;
  status?: TimeSessionStatus;
  isBillable?: boolean;
  isBilled?: boolean; // Has invoice_item_id
  fromDate?: Date | string;
  toDate?: Date | string;
  page?: number;
  limit?: number;
  sortBy?: 'start_time' | 'duration' | 'amount';
  order?: 'asc' | 'desc';
}

export interface ProjectQuery {
  clientId?: string;
  isActive?: boolean;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}

// Project with detailed stats
export interface ProjectWithStats extends Project {
  stats: ProjectStats;
  allSessions?: TimeSession[];
  unbilledSessions?: TimeSession[];
  billedSessions?: TimeSession[];
}
