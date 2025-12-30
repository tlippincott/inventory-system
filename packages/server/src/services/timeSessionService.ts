import { timeSessionModel } from '../models/timeSession.js';
import { projectModel } from '../models/project.js';
import {
  startTimeSessionSchema,
  updateTimeSessionSchema,
  bulkUpdateSessionsSchema,
  timeSessionQuerySchema,
} from '@invoice-system/shared';
import type {
  TimeSession,
  StartTimeSessionDTO,
  UpdateTimeSessionDTO,
  BulkUpdateSessionsDTO,
  TimeSessionQuery,
} from '@invoice-system/shared';

class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class BadRequestError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

class ConflictError extends Error {
  statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export const timeSessionService = {
  /**
   * Get all time sessions with optional filtering
   */
  async getAllSessions(query: unknown): Promise<TimeSession[]> {
    // Validate query parameters
    const validatedQuery = timeSessionQuerySchema.parse(query) as TimeSessionQuery;

    // Fetch sessions from model
    return await timeSessionModel.findAll(validatedQuery);
  },

  /**
   * Get a single time session by ID
   */
  async getSessionById(id: string): Promise<TimeSession> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid session ID');
    }

    const session = await timeSessionModel.findById(id);

    if (!session) {
      throw new NotFoundError(`Time session with ID ${id} not found`);
    }

    return session;
  },

  /**
   * Start a new time session
   */
  async startSession(data: unknown): Promise<TimeSession> {
    // Validate input data
    const validatedData = startTimeSessionSchema.parse(data) as StartTimeSessionDTO;

    // Check for existing running session
    const existingRunningSession = await timeSessionModel.findActiveSession();
    if (existingRunningSession) {
      throw new ConflictError('A timer is already running. Stop it first.');
    }

    // Verify project exists and get project details
    const project = await projectModel.findById(validatedData.projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID ${validatedData.projectId} not found`);
    }

    // Capture hourly rate from project
    const hourlyRateCents = project.defaultHourlyRateCents;

    // Create session
    return await timeSessionModel.create({
      projectId: validatedData.projectId,
      clientId: project.clientId,
      taskDescription: validatedData.taskDescription,
      startTime: new Date(),
      status: 'running',
      hourlyRateCents,
      isBillable: validatedData.isBillable !== undefined ? validatedData.isBillable : true,
      notes: validatedData.notes || null,
    });
  },

  /**
   * Update an existing time session
   */
  async updateSession(id: string, data: unknown): Promise<TimeSession> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid session ID');
    }

    // Validate input data
    const validatedData = updateTimeSessionSchema.parse(data) as UpdateTimeSessionDTO;

    // Check if session exists
    const existingSession = await timeSessionModel.findById(id);
    if (!existingSession) {
      throw new NotFoundError(`Time session with ID ${id} not found`);
    }

    // Prevent updates if session is billed
    if (existingSession.invoiceItemId) {
      throw new BadRequestError('Cannot update a billed session');
    }

    // Prevent updates if session is running
    if (existingSession.status === 'running') {
      throw new BadRequestError('Cannot update while timer is running. Stop it first.');
    }

    // Build update object
    const updateData: Partial<TimeSession> = {};

    if (validatedData.taskDescription !== undefined) {
      updateData.taskDescription = validatedData.taskDescription;
    }

    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    if (validatedData.isBillable !== undefined) {
      updateData.isBillable = validatedData.isBillable;
    }

    if (validatedData.hourlyRateCents !== undefined) {
      updateData.hourlyRateCents = validatedData.hourlyRateCents;
    }

    if (validatedData.durationSeconds !== undefined) {
      updateData.durationSeconds = validatedData.durationSeconds;
    }

    // If duration or hourly rate changed, recalculate billable amount
    const newDuration = validatedData.durationSeconds !== undefined
      ? validatedData.durationSeconds
      : existingSession.durationSeconds;

    const newHourlyRate = validatedData.hourlyRateCents !== undefined
      ? validatedData.hourlyRateCents
      : existingSession.hourlyRateCents;

    if ((validatedData.durationSeconds !== undefined || validatedData.hourlyRateCents !== undefined) &&
        newDuration !== null) {
      updateData.billableAmountCents = Math.round((newDuration / 3600) * newHourlyRate);
    }

    // Update session
    return await timeSessionModel.update(id, updateData);
  },

  /**
   * Delete a time session
   */
  async deleteSession(id: string): Promise<void> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid session ID');
    }

    // Check if session exists
    const existingSession = await timeSessionModel.findById(id);
    if (!existingSession) {
      throw new NotFoundError(`Time session with ID ${id} not found`);
    }

    // Prevent deletion if billed
    if (existingSession.invoiceItemId) {
      throw new BadRequestError('Cannot delete a billed session');
    }

    // Auto-stop if running
    if (existingSession.status === 'running') {
      await this.stopSession(id);
    }

    // Delete session
    await timeSessionModel.delete(id);
  },

  /**
   * Stop a running or paused session
   */
  async stopSession(id: string): Promise<TimeSession> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid session ID');
    }

    // Fetch session
    const session = await timeSessionModel.findById(id);
    if (!session) {
      throw new NotFoundError(`Time session with ID ${id} not found`);
    }

    // Validate status
    if (session.status !== 'running' && session.status !== 'paused') {
      throw new BadRequestError('Session is already stopped');
    }

    // Calculate duration
    const endTime = new Date();
    const startTime = new Date(session.startTime);
    const actualDurationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Round up to nearest quarter hour (900 seconds = 15 minutes)
    const durationSeconds = Math.ceil(actualDurationSeconds / 900) * 900;

    // Calculate billable amount
    const billableAmountCents = Math.round((durationSeconds / 3600) * session.hourlyRateCents);

    // Update session
    return await timeSessionModel.update(id, {
      endTime,
      durationSeconds,
      billableAmountCents,
      status: 'stopped',
    });
  },

  /**
   * Pause a running session
   */
  async pauseSession(id: string): Promise<TimeSession> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid session ID');
    }

    // Fetch session
    const session = await timeSessionModel.findById(id);
    if (!session) {
      throw new NotFoundError(`Time session with ID ${id} not found`);
    }

    // Validate status
    if (session.status !== 'running') {
      throw new BadRequestError('Session is already paused');
    }

    // Update status to paused (keep end_time NULL)
    return await timeSessionModel.update(id, {
      status: 'paused',
    });
  },

  /**
   * Resume a paused session
   */
  async resumeSession(id: string): Promise<TimeSession> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid session ID');
    }

    // Fetch session
    const session = await timeSessionModel.findById(id);
    if (!session) {
      throw new NotFoundError(`Time session with ID ${id} not found`);
    }

    // Validate status
    if (session.status !== 'paused') {
      throw new BadRequestError('Session is not paused');
    }

    // Check for other running sessions
    const existingRunningSession = await timeSessionModel.findActiveSession();
    if (existingRunningSession) {
      throw new ConflictError('Another timer is running');
    }

    // Update status to running
    return await timeSessionModel.update(id, {
      status: 'running',
    });
  },

  /**
   * Get the currently active (running) session
   */
  async getActiveSession(): Promise<TimeSession | null> {
    return await timeSessionModel.findActiveSession();
  },

  /**
   * Get unbilled sessions
   */
  async getUnbilledSessions(clientId?: string, projectId?: string): Promise<TimeSession[]> {
    return await timeSessionModel.findUnbilled({ clientId, projectId });
  },

  /**
   * Get all sessions for a specific project
   */
  async getSessionsByProject(projectId: string): Promise<TimeSession[]> {
    // Validate project exists
    const project = await projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} not found`);
    }

    return await timeSessionModel.findByProject(projectId);
  },

  /**
   * Bulk update multiple sessions
   */
  async bulkUpdateSessions(data: unknown): Promise<{ updated: number }> {
    // Validate input data
    const validatedData = bulkUpdateSessionsSchema.parse(data) as BulkUpdateSessionsDTO;

    // Fetch all sessions by IDs
    const sessions = await Promise.all(
      validatedData.sessionIds.map(id => timeSessionModel.findById(id))
    );

    // Check if any sessions not found
    const notFound = sessions.filter(s => s === null);
    if (notFound.length > 0) {
      throw new NotFoundError('One or more sessions not found');
    }

    // Filter out nulls (TypeScript)
    const validSessions = sessions.filter((s): s is TimeSession => s !== null);

    // Verify none are billed
    const billedSessions = validSessions.filter(s => s.invoiceItemId !== null);
    if (billedSessions.length > 0) {
      throw new BadRequestError('Cannot update billed sessions');
    }

    // Verify none are running
    const runningSessions = validSessions.filter(s => s.status === 'running');
    if (runningSessions.length > 0) {
      throw new BadRequestError('Cannot update running sessions');
    }

    // Build update object
    const updateData: Partial<TimeSession> = {};

    if (validatedData.isBillable !== undefined) {
      updateData.isBillable = validatedData.isBillable;
    }

    if (validatedData.hourlyRateCents !== undefined) {
      updateData.hourlyRateCents = validatedData.hourlyRateCents;

      // If hourly rate changed, recalculate billable amount for stopped sessions
      // We need to update each session individually for this
      for (const session of validSessions) {
        if (session.status === 'stopped' && session.durationSeconds !== null) {
          const newBillableAmount = Math.round((session.durationSeconds / 3600) * validatedData.hourlyRateCents);
          await timeSessionModel.update(session.id, {
            hourlyRateCents: validatedData.hourlyRateCents,
            billableAmountCents: newBillableAmount,
          });
        }
      }

      // Return count
      return { updated: validSessions.length };
    }

    // Update all sessions
    const count = await timeSessionModel.bulkUpdate(validatedData.sessionIds, updateData);

    return { updated: count };
  },

  /**
   * Get billing summary for unbilled sessions
   */
  async getBillingSummary(query: {
    clientId?: string;
    projectId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{
    totalDurationSeconds: number;
    totalAmountCents: number;
    sessionCount: number;
  }> {
    return await timeSessionModel.getBillingSummary(query);
  },
};
