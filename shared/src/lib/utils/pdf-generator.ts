/**
 * PDF Generation Utilities
 * Generates receipts and invoices for payments and orders
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Business information for invoices/receipts
const BUSINESS_INFO = {
  name: 'medical Platform',
  nameThai: 'แพลตฟอร์มการแพทย์',
  email: 'info@medical-platform.com',
  phone: '+66-XXX-XXXX',
  address: 'Bangkok, Thailand',
  taxId: 'TAX-ID-XXXXX', // Optional: Add actual tax ID if available
};

export interface ReceiptData {
  // Payment information
  receiptNumber: string;
  paymentId: string;
  paymentDate: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  
  // Customer information
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Payment details
  paymentType: 'hospital_booking' | 'product' | 'ticket';
  description: string;
  
  // Optional appointment/order details
  bookingNumber?: string;
  orderNumber?: string;
  items?: Array<{
    name: string;
    quantity?: number;
    price: number;
  }>;
}

export interface InvoiceData {
  // Invoice information
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  orderNumber: string;
  
  // Payment information
  paymentId?: string;
  paymentDate?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  
  // Customer information
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  billingAddress?: string;
  
  // Items
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  
  // Totals
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  
  // Additional information
  notes?: string;
  terms?: string;
  
  // Related entity (hospital, event, etc.)
  relatedEntity?: {
    name: string;
    address?: string;
    contact?: string;
  };
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number, currency: string = 'thb'): string {
  const currencySymbols: Record<string, string> = {
    thb: '฿',
    usd: '$',
    eur: '€',
  };
  
  const symbol = currencySymbols[currency.toLowerCase()] || currency.toUpperCase() + ' ';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Generate Receipt PDF
 */
export function generateReceiptPDF(data: ReceiptData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(220, 38, 38); // Red color
  doc.text('RECEIPT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(BUSINESS_INFO.name, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(BUSINESS_INFO.address, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text(`Email: ${BUSINESS_INFO.email} | Phone: ${BUSINESS_INFO.phone}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Receipt details
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Number:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.receiptNumber, margin + 50, yPosition);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Date:', pageWidth - margin - 60, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.paymentDate), pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Transaction ID:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.transactionId, margin + 50, yPosition);
  yPosition += 10;

  // Customer information
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', margin, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(data.customerName, margin, yPosition);
  yPosition += 5;
  doc.text(data.customerEmail, margin, yPosition);
  if (data.customerPhone) {
    yPosition += 5;
    doc.text(data.customerPhone, margin, yPosition);
  }
  yPosition += 10;

  // Items table
  const tableData: string[][] = [];
  
  if (data.items && data.items.length > 0) {
    data.items.forEach((item) => {
      tableData.push([
        item.name,
        item.quantity ? item.quantity.toString() : '1',
        formatCurrency(item.price, data.currency),
        formatCurrency(item.price * (item.quantity || 1), data.currency),
      ]);
    });
  } else {
    tableData.push([
      data.description,
      '1',
      formatCurrency(data.amount, data.currency),
      formatCurrency(data.amount, data.currency),
    ]);
  }

  autoTable(doc, {
    startY: yPosition,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });

  yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Payment summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Summary', margin, yPosition);
  yPosition += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Payment Method:', margin, yPosition);
  doc.text(data.paymentMethod, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Amount:', margin, yPosition);
  doc.text(formatCurrency(data.amount, data.currency), pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 15;

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer-generated receipt. No signature required.', pageWidth / 2, pageWidth * 2.83 - 20, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleString('th-TH')}`, pageWidth / 2, pageWidth * 2.83 - 15, { align: 'center' });

  return doc;
}

/**
 * Generate Invoice PDF
 */
export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  // Header
  doc.setFontSize(28);
  doc.setTextColor(220, 38, 38); // Red color
  doc.text('INVOICE', pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 10;

  // Business info (left side)
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(BUSINESS_INFO.name, margin, yPosition);
  yPosition += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(BUSINESS_INFO.address, margin, yPosition);
  yPosition += 5;
  doc.text(`Email: ${BUSINESS_INFO.email}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Phone: ${BUSINESS_INFO.phone}`, margin, yPosition);
  yPosition += 5;
  if (BUSINESS_INFO.taxId) {
    doc.text(`Tax ID: ${BUSINESS_INFO.taxId}`, margin, yPosition);
    yPosition += 5;
  }

  // Invoice details (right side)
  yPosition = margin + 10;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Number:', pageWidth - margin - 60, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.invoiceNumber, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date:', pageWidth - margin - 60, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.invoiceDate), pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 7;

  if (data.dueDate) {
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', pageWidth - margin - 60, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(data.dueDate), pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 7;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Order Number:', pageWidth - margin - 60, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.orderNumber, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 7;

  // Status badge
  const statusColors: Record<string, [number, number, number]> = {
    paid: [34, 197, 94],
    pending: [251, 191, 36],
    overdue: [239, 68, 68],
    cancelled: [107, 114, 128],
  };
  const statusColor = statusColors[data.status] || [107, 114, 128];
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - margin - 40, yPosition - 5, 40, 6, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(data.status.toUpperCase(), pageWidth - margin - 20, yPosition, { align: 'center' });
  yPosition += 15;

  // Customer information
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', margin, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(data.customerName, margin, yPosition);
  yPosition += 5;
  doc.text(data.customerEmail, margin, yPosition);
  if (data.customerPhone) {
    yPosition += 5;
    doc.text(data.customerPhone, margin, yPosition);
  }
  if (data.billingAddress) {
    yPosition += 5;
    doc.text(data.billingAddress, margin, yPosition);
  }

  // Related entity (if applicable)
  if (data.relatedEntity) {
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Service Provider:', margin, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(data.relatedEntity.name, margin, yPosition);
    if (data.relatedEntity.address) {
      yPosition += 5;
      doc.text(data.relatedEntity.address, margin, yPosition);
    }
    if (data.relatedEntity.contact) {
      yPosition += 5;
      doc.text(data.relatedEntity.contact, margin, yPosition);
    }
  }

  yPosition += 15;

  // Items table
  const tableData = data.items.map((item) => [
    item.name,
    item.quantity.toString(),
    formatCurrency(item.unitPrice, data.currency),
    formatCurrency(item.total, data.currency),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Description', 'Quantity', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 },
    },
  });

  yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Totals
  const totalsX = pageWidth - margin;
  doc.setFontSize(10);
  doc.text('Subtotal:', totalsX - 50, yPosition, { align: 'right' });
  doc.text(formatCurrency(data.subtotal, data.currency), totalsX, yPosition, { align: 'right' });
  yPosition += 7;

  if (data.discount && data.discount > 0) {
    doc.text('Discount:', totalsX - 50, yPosition, { align: 'right' });
    doc.text(`-${formatCurrency(data.discount, data.currency)}`, totalsX, yPosition, { align: 'right' });
    yPosition += 7;
  }

  if (data.tax && data.tax > 0) {
    doc.text('Tax:', totalsX - 50, yPosition, { align: 'right' });
    doc.text(formatCurrency(data.tax, data.currency), totalsX, yPosition, { align: 'right' });
    yPosition += 7;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', totalsX - 50, yPosition, { align: 'right' });
  doc.text(formatCurrency(data.total, data.currency), totalsX, yPosition, { align: 'right' });
  yPosition += 15;

  // Payment information (if paid)
  if (data.paymentDate && data.paymentId) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(34, 197, 94);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information:', margin, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Payment Date: ${formatDate(data.paymentDate)}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Payment ID: ${data.paymentId}`, margin, yPosition);
    yPosition += 10;
  }

  // Notes and terms
  if (data.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 2 * margin);
    doc.text(notesLines, margin, yPosition);
    yPosition += notesLines.length * 5 + 5;
  }

  if (data.terms) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    const termsLines = doc.splitTextToSize(data.terms, pageWidth - 2 * margin);
    doc.text(termsLines, margin, yPosition);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  const footerY = pageWidth * 2.83 - 20;
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleString('th-TH')}`, pageWidth / 2, footerY + 5, { align: 'center' });

  return doc;
}

