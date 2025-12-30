import * as fs from 'fs';
import * as path from 'path';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { invoiceModel } from '../models/invoice.js';
import { clientModel } from '../models/client.js';
import { userSettingsModel } from '../models/userSettings.js';
import { env } from '../config/env.js';
import type { Invoice, InvoiceWithClient } from '@invoice-system/shared';

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

export const pdfService = {
  /**
   * Generate PDF for an invoice
   * - Fetches invoice with full data (client, items)
   * - Fetches user settings for business info
   * - Generates PDF using pdfGenerator utility
   * - Saves PDF to file system
   * - Updates invoice.pdfPath in database
   * - Returns updated invoice
   */
  async generateInvoicePDF(invoiceId: string): Promise<Invoice> {
    try {
      // 1. Fetch invoice with full data
      const invoice = await invoiceModel.findById(invoiceId);
      if (!invoice) {
        throw new NotFoundError(`Invoice with ID ${invoiceId} not found`);
      }

      // 2. Fetch client with billing details
      const client = await clientModel.findById(invoice.clientId);
      if (!client) {
        throw new NotFoundError(`Client not found for invoice ${invoiceId}`);
      }

      // 3. Build InvoiceWithClient object
      const invoiceWithClient: InvoiceWithClient = {
        ...invoice,
        client: {
          id: client.id,
          name: client.name,
          email: client.email || null,
          companyName: client.companyName || null,
          billingAddressLine1: client.billingAddressLine1 || null,
          billingAddressLine2: client.billingAddressLine2 || null,
          billingCity: client.billingCity || null,
          billingState: client.billingState || null,
          billingPostalCode: client.billingPostalCode || null,
          billingCountry: client.billingCountry || null,
        },
        items: invoice.items || [],
      };

      // 4. Fetch user settings for business information
      const settings = await userSettingsModel.findOrCreate();

      // 5. Ensure PDF directory exists
      await this.ensurePdfDirectory();

      // 6. Generate filename
      const filename = this.generatePdfFilename(invoice.invoiceNumber);
      const fullPath = path.join(env.storage.pdfDir, filename);

      // 7. Generate PDF document
      const doc = generateInvoicePDF({
        invoice: invoiceWithClient,
        settings,
      });

      // 8. Write to file using streams
      const writeStream = fs.createWriteStream(fullPath);
      doc.pipe(writeStream);
      doc.end();

      // 9. Wait for file to be written
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
      });

      // 10. Update invoice with PDF path
      const updatedInvoice = await invoiceModel.update(invoiceId, {
        pdfPath: filename,
      });

      return updatedInvoice;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new BadRequestError(
        `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Get PDF file path for an invoice
   * - Validates invoice exists
   * - Validates PDF has been generated
   * - Verifies file exists on disk
   * - Returns full file system path
   */
  async getInvoicePDFPath(invoiceId: string): Promise<string> {
    const invoice = await invoiceModel.findById(invoiceId);

    if (!invoice) {
      throw new NotFoundError(`Invoice with ID ${invoiceId} not found`);
    }

    if (!invoice.pdfPath) {
      throw new NotFoundError('PDF has not been generated for this invoice');
    }

    const fullPath = path.join(env.storage.pdfDir, invoice.pdfPath);

    // Verify file exists
    try {
      await fs.promises.access(fullPath, fs.constants.R_OK);
    } catch (error) {
      throw new NotFoundError('PDF file not found on disk');
    }

    return fullPath;
  },

  /**
   * Ensure PDF directory exists
   * Creates directory if it doesn't exist
   */
  async ensurePdfDirectory(): Promise<void> {
    try {
      await fs.promises.mkdir(env.storage.pdfDir, {
        recursive: true,
        mode: 0o755,
      });
    } catch (error) {
      throw new BadRequestError(
        `Failed to create PDF directory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Generate filename from invoice number
   * Sanitizes filename to avoid file system issues
   */
  generatePdfFilename(invoiceNumber: string): string {
    // Replace any characters that aren't alphanumeric, dash, or underscore
    const sanitized = invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '-');
    return `${sanitized}.pdf`;
  },
};
