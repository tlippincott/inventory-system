import { invoiceModel } from '../models/invoice.js';
import { clientModel } from '../models/client.js';
import { timeSessionModel } from '../models/timeSession.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  convertSessionsToInvoiceSchema,
  createInvoiceItemSchema,
  updateInvoiceItemSchema,
} from '@invoice-system/shared';
import { db } from '../db/client.js';
import type {
  Invoice,
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  ConvertSessionsToInvoiceDTO,
  InvoiceStatus,
  CreateInvoiceItemDTO,
  UpdateInvoiceItemDTO,
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

export const invoiceService = {
  /**
   * Get all invoices with optional filtering
   */
  async getAllInvoices(query: unknown): Promise<Invoice[]> {
    // Validate query parameters
    const validatedQuery = query as any; // Invoice query schema validation would go here

    // Fetch invoices from model
    return await invoiceModel.findAll(validatedQuery);
  },

  /**
   * Get a single invoice by ID
   */
  async getInvoiceById(id: string): Promise<Invoice> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid invoice ID');
    }

    const invoice = await invoiceModel.findById(id);

    if (!invoice) {
      throw new NotFoundError(`Invoice with ID ${id} not found`);
    }

    return invoice;
  },

  /**
   * Create a new invoice manually
   */
  async createInvoice(data: unknown): Promise<Invoice> {
    // Validate input data
    const validatedData = createInvoiceSchema.parse(data) as CreateInvoiceDTO;

    // Verify client exists
    const client = await clientModel.findById(validatedData.clientId);
    if (!client) {
      throw new NotFoundError(`Client with ID ${validatedData.clientId} not found`);
    }

    // Generate invoice number
    const invoiceNumber = await invoiceModel.generateInvoiceNumber();

    // Calculate item totals
    const items = validatedData.items.map((item, index) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalCents: Math.round(item.quantity * item.unitPriceCents),
      position: index,
    }));

    // Calculate invoice totals
    const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
    const taxRate = validatedData.taxRate || 0;
    const taxAmountCents = Math.round(subtotalCents * (taxRate / 100));
    const totalCents = subtotalCents + taxAmountCents;

    // Create invoice with items
    return await invoiceModel.create({
      clientId: validatedData.clientId,
      invoiceNumber,
      issueDate: new Date(validatedData.issueDate),
      dueDate: new Date(validatedData.dueDate),
      servicePeriodEndDate: validatedData.servicePeriodEndDate ? new Date(validatedData.servicePeriodEndDate) : undefined,
      taxRate,
      currency: validatedData.currency || 'USD',
      notes: validatedData.notes,
      terms: validatedData.terms,
      items,
      subtotalCents,
      taxAmountCents,
      totalCents,
    });
  },

  /**
   * Create invoice from time sessions
   */
  async createInvoiceFromSessions(data: unknown): Promise<Invoice> {
    // Validate input data
    const validatedData = convertSessionsToInvoiceSchema.parse(data) as ConvertSessionsToInvoiceDTO;

    // Fetch all sessions
    const sessions = await Promise.all(
      validatedData.sessionIds.map(id => timeSessionModel.findById(id))
    );

    // Check if any sessions not found
    const notFound = sessions.filter(s => s === null);
    if (notFound.length > 0) {
      throw new NotFoundError('One or more time sessions not found');
    }

    // Filter out nulls
    const validSessions = sessions.filter((s): s is NonNullable<typeof s> => s !== null);

    // Verify all sessions are stopped
    const nonStopped = validSessions.filter(s => s.status !== 'stopped');
    if (nonStopped.length > 0) {
      throw new BadRequestError('All time sessions must be stopped before creating an invoice');
    }

    // Verify all sessions are unbilled
    const alreadyBilled = validSessions.filter(s => s.invoiceItemId !== null);
    if (alreadyBilled.length > 0) {
      throw new BadRequestError('One or more sessions have already been billed');
    }

    // Verify all sessions are billable
    const nonBillable = validSessions.filter(s => !s.isBillable);
    if (nonBillable.length > 0) {
      throw new BadRequestError('All sessions must be billable');
    }

    // Verify all sessions belong to the same client
    const clientIds = new Set(validSessions.map(s => s.clientId));
    if (clientIds.size > 1) {
      throw new BadRequestError('All sessions must belong to the same client');
    }

    const sessionClientId = validSessions[0].clientId;
    if (sessionClientId !== validatedData.clientId) {
      throw new BadRequestError('Sessions do not belong to the specified client');
    }

    // Generate invoice number
    const invoiceNumber = await invoiceModel.generateInvoiceNumber();

    // Create invoice items
    let items: Array<{
      description: string;
      quantity: number;
      unitPriceCents: number;
      totalCents: number;
      position: number;
    }>;

    if (validatedData.groupByProject) {
      // Group sessions by project
      const grouped = validSessions.reduce((acc, session) => {
        if (!acc[session.projectId]) {
          acc[session.projectId] = [];
        }
        acc[session.projectId].push(session);
        return acc;
      }, {} as Record<string, typeof validSessions>);

      // Create one item per project
      items = Object.entries(grouped).map(([_projectId, projectSessions], index) => {
        const totalDurationSeconds = projectSessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
        const totalHours = totalDurationSeconds / 3600;
        const totalAmountCents = projectSessions.reduce((sum, s) => sum + (s.billableAmountCents || 0), 0);
        const averageRate = Math.round(totalAmountCents / totalHours);
        const projectName = projectSessions[0].project?.name || 'Unknown Project';

        return {
          description: `${projectName} - Time tracking (${totalHours.toFixed(2)} hours)`,
          quantity: totalHours,
          unitPriceCents: averageRate,
          totalCents: totalAmountCents,
          position: index,
        };
      });
    } else {
      // Create one item per session
      items = validSessions.map((session, index) => {
        const hours = (session.durationSeconds || 0) / 3600;
        const projectName = session.project?.name || 'Unknown Project';

        return {
          description: `${projectName} - ${session.taskDescription}`,
          quantity: hours,
          unitPriceCents: session.hourlyRateCents,
          totalCents: session.billableAmountCents || 0,
          position: index,
        };
      });
    }

    // Calculate invoice totals
    const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
    const taxRate = validatedData.taxRate || 0;
    const taxAmountCents = Math.round(subtotalCents * (taxRate / 100));
    const totalCents = subtotalCents + taxAmountCents;

    // Create invoice
    const invoice = await invoiceModel.create({
      clientId: validatedData.clientId,
      invoiceNumber,
      issueDate: new Date(validatedData.issueDate),
      dueDate: new Date(validatedData.dueDate),
      servicePeriodEndDate: validatedData.servicePeriodEndDate ? new Date(validatedData.servicePeriodEndDate) : undefined,
      taxRate,
      currency: 'USD',
      notes: validatedData.notes,
      terms: validatedData.terms,
      items,
      subtotalCents,
      taxAmountCents,
      totalCents,
    });

    // Update sessions to link them to invoice items
    // For simplicity, we'll link all sessions to the first item if grouped, or to their respective items
    if (validatedData.groupByProject) {
      // Get the invoice items we just created
      const invoiceItems = invoice.items || [];

      // Group sessions by project again to map to items
      const grouped = validSessions.reduce((acc, session) => {
        if (!acc[session.projectId]) {
          acc[session.projectId] = [];
        }
        acc[session.projectId].push(session);
        return acc;
      }, {} as Record<string, typeof validSessions>);

      // Link each group of sessions to their corresponding invoice item
      let itemIndex = 0;
      for (const projectSessions of Object.values(grouped)) {
        const itemId = invoiceItems[itemIndex]?.id;
        if (itemId) {
          await Promise.all(
            projectSessions.map(session =>
              db('time_sessions')
                .where({ id: session.id })
                .update({
                  invoice_item_id: itemId,
                  billed_at: db.fn.now(),
                })
            )
          );
        }
        itemIndex++;
      }
    } else {
      // Link each session to its corresponding item
      const invoiceItems = invoice.items || [];
      await Promise.all(
        validSessions.map((session, index) =>
          db('time_sessions')
            .where({ id: session.id })
            .update({
              invoice_item_id: invoiceItems[index]?.id,
              billed_at: db.fn.now(),
            })
        )
      );
    }

    return invoice;
  },

  /**
   * Update an existing invoice
   */
  async updateInvoice(id: string, data: unknown): Promise<Invoice> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid invoice ID');
    }

    // Validate input data
    const validatedData = updateInvoiceSchema.parse(data) as UpdateInvoiceDTO;

    // Check if invoice exists
    const existingInvoice = await invoiceModel.findById(id);
    if (!existingInvoice) {
      throw new NotFoundError(`Invoice with ID ${id} not found`);
    }

    // Prevent updates if invoice is paid
    if (existingInvoice.status === 'paid') {
      throw new BadRequestError('Cannot update a paid invoice');
    }

    // Prepare update data with proper date conversion
    const updateData: Partial<Invoice> = {};
    if (validatedData.issueDate !== undefined) {
      updateData.issueDate = new Date(validatedData.issueDate);
    }
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }
    if (validatedData.taxRate !== undefined) {
      updateData.taxRate = validatedData.taxRate;
    }
    if (validatedData.currency !== undefined) {
      updateData.currency = validatedData.currency;
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }
    if (validatedData.terms !== undefined) {
      updateData.terms = validatedData.terms;
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }

    // Update invoice
    const updated = await invoiceModel.update(id, updateData);

    // If tax rate changed, recalculate totals
    if (validatedData.taxRate !== undefined && validatedData.taxRate !== existingInvoice.taxRate) {
      await invoiceModel.calculateTotals(id);
      return await invoiceModel.findById(id) as Invoice;
    }

    return updated;
  },

  /**
   * Delete an invoice
   */
  async deleteInvoice(id: string): Promise<void> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid invoice ID');
    }

    // Check if invoice exists
    const existingInvoice = await invoiceModel.findById(id);
    if (!existingInvoice) {
      throw new NotFoundError(`Invoice with ID ${id} not found`);
    }

    // Check for payments
    const paymentCount = await db('payments')
      .where({ invoice_id: id })
      .count('* as count')
      .first();

    if (paymentCount && Number(paymentCount.count) > 0) {
      throw new BadRequestError('Cannot delete an invoice that has payments');
    }

    // Prevent deletion if paid
    if (existingInvoice.status === 'paid') {
      throw new BadRequestError('Cannot delete a paid invoice');
    }

    // Unlink time sessions
    if (existingInvoice.items && existingInvoice.items.length > 0) {
      await db('time_sessions')
        .whereIn('invoice_item_id', existingInvoice.items.map(item => item.id))
        .update({
          invoice_item_id: null,
          billed_at: null,
        });
    }

    // Delete invoice (CASCADE deletes items)
    await invoiceModel.delete(id);
  },

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new BadRequestError('Invalid invoice ID');
    }

    // Check if invoice exists
    const existingInvoice = await invoiceModel.findById(id);
    if (!existingInvoice) {
      throw new NotFoundError(`Invoice with ID ${id} not found`);
    }

    // Update status
    return await invoiceModel.updateStatus(id, status);
  },

  /**
   * Get all invoices for a specific client
   */
  async getInvoicesByClient(clientId: string): Promise<Invoice[]> {
    // Validate client exists
    const client = await clientModel.findById(clientId);
    if (!client) {
      throw new NotFoundError(`Client with ID ${clientId} not found`);
    }

    return await invoiceModel.findByClient(clientId);
  },

  /**
   * Add an invoice item
   */
  async addInvoiceItem(invoiceId: string, data: unknown): Promise<Invoice> {
    // Validate invoice exists
    const invoice = await invoiceModel.findById(invoiceId);
    if (!invoice) {
      throw new NotFoundError(`Invoice with ID ${invoiceId} not found`);
    }

    // Prevent if paid
    if (invoice.status === 'paid') {
      throw new BadRequestError('Cannot add items to a paid invoice');
    }

    // Validate item data
    const validatedData = createInvoiceItemSchema.parse(data) as CreateInvoiceItemDTO;

    // Get current item count for position
    const itemCount = await invoiceModel.getItemCount(invoiceId);

    // Create item
    await invoiceModel.createItem(invoiceId, {
      ...validatedData,
      position: itemCount,
    });

    // Recalculate invoice totals
    await invoiceModel.calculateTotals(invoiceId);

    // Return updated invoice
    const updated = await invoiceModel.findById(invoiceId);
    if (!updated) {
      throw new Error('Invoice not found after adding item');
    }

    return updated;
  },

  /**
   * Update an invoice item
   */
  async updateInvoiceItem(invoiceId: string, itemId: string, data: unknown): Promise<Invoice> {
    // Validate invoice exists
    const invoice = await invoiceModel.findById(invoiceId);
    if (!invoice) {
      throw new NotFoundError(`Invoice with ID ${invoiceId} not found`);
    }

    // Prevent if paid
    if (invoice.status === 'paid') {
      throw new BadRequestError('Cannot update items on a paid invoice');
    }

    // Validate item data
    const validatedData = updateInvoiceItemSchema.parse(data) as UpdateInvoiceItemDTO;

    // Update item
    await invoiceModel.updateItem(invoiceId, itemId, validatedData);

    // Recalculate invoice totals
    await invoiceModel.calculateTotals(invoiceId);

    // Return updated invoice
    const updated = await invoiceModel.findById(invoiceId);
    if (!updated) {
      throw new Error('Invoice not found after updating item');
    }

    return updated;
  },

  /**
   * Delete an invoice item
   */
  async deleteInvoiceItem(invoiceId: string, itemId: string): Promise<Invoice> {
    // Validate invoice exists
    const invoice = await invoiceModel.findById(invoiceId);
    if (!invoice) {
      throw new NotFoundError(`Invoice with ID ${invoiceId} not found`);
    }

    // Prevent if paid
    if (invoice.status === 'paid') {
      throw new BadRequestError('Cannot delete items from a paid invoice');
    }

    // Check invoice has more than 1 item
    const itemCount = await invoiceModel.getItemCount(invoiceId);
    if (itemCount <= 1) {
      throw new BadRequestError('Cannot delete the last item from an invoice');
    }

    // Unlink any time sessions linked to this item
    await db('time_sessions')
      .where({ invoice_item_id: itemId })
      .update({
        invoice_item_id: null,
        billed_at: null,
      });

    // Delete item
    await invoiceModel.deleteItem(invoiceId, itemId);

    // Recalculate invoice totals
    await invoiceModel.calculateTotals(invoiceId);

    // Return updated invoice
    const updated = await invoiceModel.findById(invoiceId);
    if (!updated) {
      throw new Error('Invoice not found after deleting item');
    }

    return updated;
  },
};
