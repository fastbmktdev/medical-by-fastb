/**
 * Export Utilities
 * Universal functions for exporting data to PDF/CSV
 * รองรับ Thai fonts และ formatting
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn<T = Record<string, unknown>> {
  /**
   * Key ของคอลัมน์ในข้อมูล
   */
  key: string;
  
  /**
   * Label ที่จะแสดงใน header
   */
  label: string;
  
  /**
   * Function สำหรับ format ข้อมูลก่อน export (optional)
   */
  format?: (value: unknown, row: T) => string;
  
  /**
   * ความกว้างของคอลัมน์ (optional, สำหรับ PDF)
   */
  width?: number;
}

export interface ExportPDFOptions<T = Record<string, unknown>> {
  data: T[];
  columns?: ExportColumn<T>[];
  filename: string;
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'legal';
  includeTimestamp?: boolean;
  includeRowNumbers?: boolean;
}

export interface ExportCSVOptions<T = Record<string, unknown>> {
  data: T[];
  columns?: ExportColumn<T>[];
  filename: string;
  includeTimestamp?: boolean;
}

/**
 * สร้างคอลัมน์อัตโนมัติจากข้อมูล
 */
function generateColumnsFromData<T>(data: T[]): ExportColumn<T>[] {
  if (data.length === 0) return [];
  
  const firstRow = data[0] as Record<string, unknown>;
  return Object.keys(firstRow).map(key => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
  }));
}

/**
 * Format ค่าสำหรับการแสดงผล
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  
  if (value instanceof Date) {
    return value.toLocaleDateString('th-TH');
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Export ข้อมูลเป็น PDF
 */
export async function exportToPDF<T = Record<string, unknown>>({
  data,
  columns: providedColumns,
  filename,
  title = 'Report',
  subtitle,
  orientation = 'landscape',
  pageSize = 'a4',
  includeTimestamp = true,
  includeRowNumbers = true,
}: ExportPDFOptions<T>): Promise<void> {
  try {
    // สร้าง PDF document
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize,
    });

    // กำหนดคอลัมน์
    const columns = providedColumns || generateColumnsFromData(data);
    
    // เพิ่ม row numbers ถ้าต้องการ
    const headers = includeRowNumbers 
      ? ['#', ...columns.map(col => col.label)]
      : columns.map(col => col.label);

    // เตรียมข้อมูล
    const rows = data.map((row, index) => {
      const rowData = columns.map(col => {
        const value = (row as Record<string, unknown>)[col.key];
        return col.format ? col.format(value, row) : formatValue(value);
      });
      
      return includeRowNumbers ? [String(index + 1), ...rowData] : rowData;
    });

    // คำนวณตำแหน่ง Y เริ่มต้น
    let currentY = 20;

    // เพิ่มหัวข้อ
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, currentY);
    currentY += 10;

    // เพิ่ม subtitle (ถ้ามี)
    if (subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, 14, currentY);
      currentY += 8;
    }

    // เพิ่ม timestamp (ถ้าต้องการ)
    if (includeTimestamp) {
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      const timestamp = new Date().toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.text(`Generated: ${timestamp}`, 14, currentY);
      currentY += 10;
    }

    // เพิ่มตาราง
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: currentY,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [220, 38, 38], // red-600
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // gray-50
      },
      columnStyles: includeRowNumbers ? {
        0: { cellWidth: 10, halign: 'center' }, // Row number column
      } : undefined,
      margin: { top: 10, right: 14, bottom: 10, left: 14 },
      didDrawPage: (data) => {
        // เพิ่มเลขหน้า
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      },
    });

    // บันทึกไฟล์
    const finalFilename = includeTimestamp
      ? `${filename}_${new Date().toISOString().split('T')[0]}.pdf`
      : `${filename}.pdf`;
    
    doc.save(finalFilename);
  } catch (error) {
    console.error('PDF Export error:', error);
    throw new Error('Failed to export PDF');
  }
}

/**
 * Export ข้อมูลเป็น CSV
 */
export async function exportToCSV<T = Record<string, unknown>>({
  data,
  columns: providedColumns,
  filename,
  includeTimestamp = true,
}: ExportCSVOptions<T>): Promise<void> {
  try {
    // กำหนดคอลัมน์
    const columns = providedColumns || generateColumnsFromData(data);
    
    // สร้าง header row
    const headers = columns.map(col => col.label).join(',');
    
    // สร้าง data rows
    const rows = data.map(row => {
      return columns.map(col => {
        const value = (row as Record<string, unknown>)[col.key];
        const formatted = col.format ? col.format(value, row) : formatValue(value);
        
        // Escape commas and quotes for CSV
        if (formatted.includes(',') || formatted.includes('"') || formatted.includes('\n')) {
          return `"${formatted.replace(/"/g, '""')}"`;
        }
        return formatted;
      }).join(',');
    });
    
    // รวม CSV content
    const csvContent = [headers, ...rows].join('\n');
    
    // เพิ่ม BOM สำหรับ UTF-8 (เพื่อให้ Excel อ่านภาษาไทยได้)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // สร้างลิงก์ดาวน์โหลด
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const finalFilename = includeTimestamp
      ? `${filename}_${new Date().toISOString().split('T')[0]}.csv`
      : `${filename}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CSV Export error:', error);
    throw new Error('Failed to export CSV');
  }
}

/**
 * Export ข้อมูลเป็น JSON (bonus feature)
 */
export async function exportToJSON<T = Record<string, unknown>>({
  data,
  filename,
  prettify = true,
}: {
  data: T[];
  filename: string;
  prettify?: boolean;
}): Promise<void> {
  try {
    const jsonContent = prettify 
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
    
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('JSON Export error:', error);
    throw new Error('Failed to export JSON');
  }
}
