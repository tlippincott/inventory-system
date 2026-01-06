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
  y = drawHeader(doc, settings, y);

  // Invoice date and number directly under separator line
  y = drawInvoiceDateAndNumber(doc, settings, invoice, y);

  // Two lines of space
  y += 20;

  // Bill to (left) and Payable to (right)
  y = drawBillToAndPayableTo(doc, settings, invoice, y);

  // Work period line (if service period end date is provided and valid)
  if (invoice.servicePeriodEndDate && invoice.servicePeriodEndDate !== null) {
    try {
      const serviceDate = typeof invoice.servicePeriodEndDate === 'string'
        ? new Date(invoice.servicePeriodEndDate)
        : invoice.servicePeriodEndDate;

      // Only draw if date is valid (not Invalid Date)
      if (serviceDate && serviceDate instanceof Date && !isNaN(serviceDate.getTime())) {
        y += 20; // Two lines of space
        y = drawWorkPeriodLine(doc, invoice, serviceDate, y);
      }
    } catch (error) {
      // Silently skip if date parsing fails
      console.error('Failed to parse service period end date:', error);
    }
  }

  // Line items table
  y = drawLineItemsTable(doc, invoice.items, y);

  // Totals section
  y = drawTotalsSection(doc, invoice, y);

  // Footer (notes and terms)
  drawFooter(doc, invoice);

  return doc;
}

/**
 * Draw the header with "INVOICE" on left, business name on right, and horizontal line
 */
function drawHeader(doc: PDFKit.PDFDocument, settings: UserSettings, y: number): number {
  const pageWidth = 595.28; // A4 width in points
  const margin = 50;

  // "INVOICE" on the left - 20pt, Helvetica (light)
  doc
    .fontSize(20)
    .font('Helvetica')
    .text('INVOICE', margin, y);

  // Business name on the right - 13pt, Helvetica-Bold
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .text(settings.businessName, margin, y, {
      width: pageWidth - (margin * 2),
      align: 'right'
    });

  y += 30;

  // Solid black line across the page - 2.5pt thickness
  doc
    .strokeColor('#000000')
    .lineWidth(2.5)
    .moveTo(margin, y)
    .lineTo(pageWidth - margin, y)
    .stroke();

  return y + 20;
}

/**
 * Draw invoice date and invoice number directly under separator line
 */
function drawInvoiceDateAndNumber(
  doc: PDFKit.PDFDocument,
  settings: UserSettings,
  invoice: InvoiceWithClient,
  y: number
): number {
  const pageWidth = 595.28; // A4 width in points
  const margin = 50;

  // Format invoice number as: [prefix]YYYY-MM-DD
  const invoiceDate = typeof invoice.issueDate === 'string' ? new Date(invoice.issueDate) : invoice.issueDate;
  const formattedDate = formatDateAsYYYYMMDD(invoiceDate);
  const invoiceNumber = settings.invoicePrefix ? `${settings.invoicePrefix}${formattedDate}` : formattedDate;

  // Left side: "Invoice date:" and the date
  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Invoice date: ${formatDate(invoice.issueDate)}`, margin, y);

  // Right side: "Invoice Number:" and the formatted number
  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Invoice Number: ${invoiceNumber}`, margin, y, {
      width: pageWidth - (margin * 2),
      align: 'right'
    });

  return y + 30;
}

/**
 * Draw "Bill to:" (left) and "Payable to:" (right)
 */
function drawBillToAndPayableTo(
  doc: PDFKit.PDFDocument,
  settings: UserSettings,
  invoice: InvoiceWithClient,
  y: number
): number {
  const margin = 50;
  const rightColumnX = 300;
  let leftY = y;
  let rightY = y;

  // LEFT SIDE: "Bill to:"
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Bill to:', margin, leftY);

  leftY += 15;
  doc.fontSize(10).font('Helvetica');

  // Client Name
  if (invoice.client.name) {
    doc.text(invoice.client.name, margin, leftY);
    leftY += 12;
  }

  // Company Name
  if (invoice.client.companyName) {
    doc.text(invoice.client.companyName, margin, leftY);
    leftY += 12;
  }

  // Company Street Address (both lines if available)
  if (invoice.client.billingAddressLine1) {
    doc.text(invoice.client.billingAddressLine1, margin, leftY);
    leftY += 12;
  }

  if (invoice.client.billingAddressLine2) {
    doc.text(invoice.client.billingAddressLine2, margin, leftY);
    leftY += 12;
  }

  // City, State, ZIP
  const clientCityStateZip = [
    invoice.client.billingCity,
    invoice.client.billingState,
    invoice.client.billingPostalCode
  ].filter(Boolean).join(', ');

  if (clientCityStateZip) {
    doc.text(clientCityStateZip, margin, leftY);
    leftY += 12;
  }

  // Client email
  if (invoice.client.email) {
    doc.text(invoice.client.email, margin, leftY);
    leftY += 12;
  }

  // RIGHT SIDE: "Payable to:"
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Payable to:', rightColumnX, rightY);

  rightY += 15;
  doc.fontSize(10).font('Helvetica');

  // User's name (use ownerName if available, otherwise businessName)
  const userName = settings.ownerName || settings.businessName;
  if (userName) {
    doc.text(userName, rightColumnX, rightY);
    rightY += 12;
  }

  // User's street address (both lines if available)
  if (settings.addressLine1) {
    doc.text(settings.addressLine1, rightColumnX, rightY);
    rightY += 12;
  }

  if (settings.addressLine2) {
    doc.text(settings.addressLine2, rightColumnX, rightY);
    rightY += 12;
  }

  // User's city, state, ZIP
  const userCityStateZip = [
    settings.city,
    settings.state,
    settings.postalCode
  ].filter(Boolean).join(', ');

  if (userCityStateZip) {
    doc.text(userCityStateZip, rightColumnX, rightY);
    rightY += 12;
  }

  // Blank line
  rightY += 12;

  // User's email address
  if (settings.email) {
    doc.text(settings.email, rightColumnX, rightY);
    rightY += 12;
  }

  return Math.max(leftY, rightY) + 20;
}

/**
 * Draw work period line
 */
function drawWorkPeriodLine(
  doc: PDFKit.PDFDocument,
  invoice: InvoiceWithClient,
  serviceDate: Date,
  y: number
): number {
  const margin = 50;

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`For design work done through ${formatDate(serviceDate)}`, margin, y);

  return y + 30;
}

/**
 * Draw line items table (project-based)
 */
function drawLineItemsTable(
  doc: PDFKit.PDFDocument,
  items: InvoiceItem[],
  y: number
): number {
  const tableTop = y;
  const descriptionX = 50;
  const hoursX = 320;
  const unitPriceX = 400;
  const totalX = 490;

  // Table header background - #AA2151 with white text
  doc.rect(50, tableTop, 495, 25).fillAndStroke('#AA2151', '#AA2151');

  // Table header text - white color
  doc
    .fillColor('#FFFFFF')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Description', descriptionX, tableTop + 8)
    .text('Hours', hoursX, tableTop + 8)
    .text('Unit Price', unitPriceX, tableTop + 8)
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
      .text(item.description, descriptionX, y, { width: 260 })
      .text(item.quantity.toFixed(2), hoursX, y)
      .text(formatCurrency(item.unitPriceCents), unitPriceX, y)
      .text(formatCurrency(item.totalCents), totalX, y);

    y += 20;
  });

  return y + 20;
}

/**
 * Draw totals section (subtotal, Hawaii GET tax, total)
 */
function drawTotalsSection(
  doc: PDFKit.PDFDocument,
  invoice: InvoiceWithClient,
  y: number
): number {
  const labelX = 350;
  const amountX = 490;

  // Subtotal
  doc.fontSize(10).font('Helvetica');
  doc.text('Subtotal', labelX, y);
  doc.text(formatCurrency(invoice.subtotalCents, invoice.currency), amountX, y);
  y += 15;

  // Hawaii GET Tax (4.71%)
  doc.text('Hawaii GET Tax (4.71%)', labelX, y);
  doc.text(formatCurrency(invoice.taxAmountCents, invoice.currency), amountX, y);
  y += 20;

  // Total (bold and larger)
  doc.fontSize(11).font('Helvetica-Bold');
  doc.text('Total', labelX, y);
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

/**
 * Format date as YYYY-MM-DD
 */
function formatDateAsYYYYMMDD(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
