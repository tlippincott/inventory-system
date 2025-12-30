import PDFDocument from 'pdfkit';
import type { InvoiceWithClient, UserSettings, InvoiceItem } from '@invoice-system/shared';

interface PDFGenerationData {
  invoice: InvoiceWithClient;
  settings: UserSettings;
}

/**
 * Generate a professional PDF invoice document
 * Returns the PDFDocument instance (stream)
 */
export function generateInvoicePDF(data: PDFGenerationData): PDFKit.PDFDocument {
  const { invoice, settings } = data;

  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true,
  });

  let y = 50;

  // Header
  y = drawHeader(doc, y);

  // Business info (left) and Invoice metadata (right)
  y = drawBusinessAndInvoiceInfo(doc, settings, invoice, y);

  // Client billing information
  y = drawClientInfo(doc, invoice, y);

  // Line items table
  y = drawLineItemsTable(doc, invoice.items, y);

  // Totals section
  y = drawTotalsSection(doc, invoice, y);

  // Footer (notes and terms)
  drawFooter(doc, invoice);

  return doc;
}

/**
 * Draw the "INVOICE" header
 */
function drawHeader(doc: PDFKit.PDFDocument, y: number): number {
  doc
    .fontSize(28)
    .font('Helvetica-Bold')
    .text('INVOICE', 50, y);

  return y + 60;
}

/**
 * Draw business information (left) and invoice metadata (right)
 */
function drawBusinessAndInvoiceInfo(
  doc: PDFKit.PDFDocument,
  settings: UserSettings,
  invoice: InvoiceWithClient,
  y: number
): number {
  const startY = y;

  // Business information (left side)
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text(settings.businessName, 50, y);

  y += 15;
  doc.fontSize(9).font('Helvetica');

  if (settings.addressLine1) {
    doc.text(settings.addressLine1, 50, y);
    y += 12;
  }

  if (settings.addressLine2) {
    doc.text(settings.addressLine2, 50, y);
    y += 12;
  }

  const cityStateZip = [
    settings.city,
    settings.state,
    settings.postalCode
  ].filter(Boolean).join(', ');

  if (cityStateZip) {
    doc.text(cityStateZip, 50, y);
    y += 12;
  }

  if (settings.country) {
    doc.text(settings.country, 50, y);
    y += 12;
  }

  if (settings.email) {
    y += 5;
    doc.text(`Email: ${settings.email}`, 50, y);
    y += 12;
  }

  if (settings.phone) {
    doc.text(`Phone: ${settings.phone}`, 50, y);
    y += 12;
  }

  // Invoice metadata (right side)
  const rightX = 350;
  let rightY = startY;

  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Invoice Number:', rightX, rightY);
  doc.font('Helvetica').text(invoice.invoiceNumber, rightX + 100, rightY);
  rightY += 15;

  doc.font('Helvetica-Bold').text('Issue Date:', rightX, rightY);
  doc.font('Helvetica').text(formatDate(invoice.issueDate), rightX + 100, rightY);
  rightY += 15;

  doc.font('Helvetica-Bold').text('Due Date:', rightX, rightY);
  doc.font('Helvetica').text(formatDate(invoice.dueDate), rightX + 100, rightY);
  rightY += 15;

  doc.font('Helvetica-Bold').text('Status:', rightX, rightY);
  doc.font('Helvetica').text(invoice.status.toUpperCase(), rightX + 100, rightY);

  return Math.max(y, rightY) + 30;
}

/**
 * Draw client billing information
 */
function drawClientInfo(
  doc: PDFKit.PDFDocument,
  invoice: InvoiceWithClient,
  y: number
): number {
  doc.fontSize(11).font('Helvetica-Bold');
  doc.text('BILL TO:', 50, y);

  y += 20;
  doc.fontSize(10).font('Helvetica-Bold');

  if (invoice.client.companyName) {
    doc.text(invoice.client.companyName, 50, y);
    y += 15;
  }

  doc.text(invoice.client.name, 50, y);

  y += 15;
  doc.fontSize(9).font('Helvetica');

  if (invoice.client.email) {
    doc.text(invoice.client.email, 50, y);
    y += 12;
  }

  if (invoice.client.billingAddressLine1) {
    doc.text(invoice.client.billingAddressLine1, 50, y);
    y += 12;
  }

  if (invoice.client.billingAddressLine2) {
    doc.text(invoice.client.billingAddressLine2, 50, y);
    y += 12;
  }

  const cityStateZip = [
    invoice.client.billingCity,
    invoice.client.billingState,
    invoice.client.billingPostalCode
  ].filter(Boolean).join(', ');

  if (cityStateZip) {
    doc.text(cityStateZip, 50, y);
    y += 12;
  }

  if (invoice.client.billingCountry) {
    doc.text(invoice.client.billingCountry, 50, y);
    y += 12;
  }

  return y + 30;
}

/**
 * Draw line items table
 */
function drawLineItemsTable(
  doc: PDFKit.PDFDocument,
  items: InvoiceItem[],
  y: number
): number {
  const tableTop = y;
  const descriptionX = 50;
  const quantityX = 350;
  const priceX = 420;
  const totalX = 490;

  // Table header background
  doc.rect(50, tableTop, 495, 25).fillAndStroke('#E5E7EB', '#D1D5DB');

  // Table header text
  doc
    .fillColor('#000000')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Description', descriptionX, tableTop + 8)
    .text('Qty', quantityX, tableTop + 8)
    .text('Price', priceX, tableTop + 8)
    .text('Total', totalX, tableTop + 8);

  y = tableTop + 30;

  // Table rows
  items.forEach((item, index) => {
    // Alternating row background
    if (index % 2 === 1) {
      doc.rect(50, y - 5, 495, 20).fill('#F9FAFB');
    }

    doc
      .fillColor('#000000')
      .fontSize(9)
      .font('Helvetica')
      .text(item.description, descriptionX, y, { width: 290 })
      .text(item.quantity.toFixed(2), quantityX, y)
      .text(formatCurrency(item.unitPriceCents), priceX, y)
      .text(formatCurrency(item.totalCents), totalX, y);

    y += 20;
  });

  return y + 20;
}

/**
 * Draw totals section (subtotal, tax, total)
 */
function drawTotalsSection(
  doc: PDFKit.PDFDocument,
  invoice: InvoiceWithClient,
  y: number
): number {
  const labelX = 400;
  const amountX = 490;

  // Subtotal
  doc.fontSize(9).font('Helvetica');
  doc.text('Subtotal:', labelX, y);
  doc.text(formatCurrency(invoice.subtotalCents, invoice.currency), amountX, y);
  y += 15;

  // Tax
  doc.text(`Tax (${invoice.taxRate}%):`, labelX, y);
  doc.text(formatCurrency(invoice.taxAmountCents, invoice.currency), amountX, y);
  y += 20;

  // Total (bold and larger)
  doc.fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL:', labelX, y);
  doc.text(formatCurrency(invoice.totalCents, invoice.currency), amountX, y);

  return y + 30;
}

/**
 * Draw footer (notes and terms)
 */
function drawFooter(doc: PDFKit.PDFDocument, invoice: InvoiceWithClient): void {
  let y = 650; // Fixed position near bottom of page

  if (invoice.notes) {
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Notes:', 50, y);
    y += 15;

    doc.fontSize(8).font('Helvetica');
    doc.text(invoice.notes, 50, y, { width: 495 });
    y += 30;
  }

  if (invoice.terms) {
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Payment Terms:', 50, y);
    y += 15;

    doc.fontSize(8).font('Helvetica');
    doc.text(invoice.terms, 50, y, { width: 495 });
  }
}

/**
 * Format currency from cents to dollars with symbol
 */
function formatCurrency(cents: number, currency: string = 'USD'): string {
  const amount = cents / 100;
  const symbol = currency === 'USD' ? '$' : currency + ' ';
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Format date to readable string
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
