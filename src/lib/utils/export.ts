/**
 * Export Utilities
 * Functions for exporting data to PDF and CSV formats
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to CSV format
 */
export function exportToCSV(
  data: Record<string, any>[],
  filename: string,
  headers?: string[]
): void {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Get all unique keys from data
  const allKeys = new Set<string>();
  data.forEach((row) => {
    Object.keys(row).forEach((key) => allKeys.add(key));
  });

  // Use provided headers or all keys
  const columns = headers || Array.from(allKeys);

  // Create CSV content
  const csvRows: string[] = [];

  // Add headers
  csvRows.push(columns.map((col) => escapeCSVValue(col)).join(','));

  // Add data rows
  data.forEach((row) => {
    const values = columns.map((col) => {
      const value = row[col];
      if (value === null || value === undefined) return '';
      
      // Handle arrays
      if (Array.isArray(value)) {
        return escapeCSVValue(value.join('; '));
      }
      
      // Handle objects
      if (typeof value === 'object') {
        return escapeCSVValue(JSON.stringify(value));
      }
      
      return escapeCSVValue(String(value));
    });
    csvRows.push(values.join(','));
  });

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Escape CSV value to handle commas, quotes, and newlines
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export data to PDF format
 */
export function exportToPDF(
  data: Record<string, any>[],
  filename: string,
  title: string,
  headers?: string[],
  columnHeaders?: string[]
): void {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Add export date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString('th-TH')}`, 14, 30);

  // Get all unique keys from data
  const allKeys = new Set<string>();
  data.forEach((row) => {
    Object.keys(row).forEach((key) => allKeys.add(key));
  });

  // Use provided headers or all keys
  const columns = headers || Array.from(allKeys);
  
  // Use provided column headers or column names
  const tableHeaders = columnHeaders || columns.map((col) => col.toUpperCase().replace(/_/g, ' '));

  // Prepare table data
  const tableData = data.map((row) => {
    return columns.map((col) => {
      const value = row[col];
      if (value === null || value === undefined) return '';
      
      // Handle arrays
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      
      // Handle objects
      if (typeof value === 'object') {
        return JSON.stringify(value).substring(0, 50); // Limit length
      }
      
      // Format dates
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          const date = new Date(value);
          return date.toLocaleDateString('th-TH');
        } catch {
          return value;
        }
      }
      
      return String(value);
    });
  });

  // Generate table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [220, 53, 69], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 35 },
  });

  // Save PDF
  doc.save(`${filename}.pdf`);
}

/**
 * Format data for export (clean up nested objects, arrays, etc.)
 */
export function formatDataForExport(
  data: Record<string, any>[],
  columnMapping?: Record<string, string>
): Array<Record<string, any>> {
  return data.map((row) => {
    const formatted: Record<string, any> = {};
    
    Object.keys(row).forEach((key) => {
      const displayKey = columnMapping?.[key] || key;
      let value = row[key];

      // Handle arrays
      if (Array.isArray(value)) {
        value = value.join(', ');
      }
      
      // Handle objects (extract useful info)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // For gyms/users objects, get name
        if (value.gym_name || value.full_name || value.email) {
          value = value.gym_name || value.full_name || value.email;
        } else {
          value = JSON.stringify(value).substring(0, 100);
        }
      }

      // Format dates
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          const date = new Date(value);
          value = date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } catch {
          // Keep original value
        }
      }

      formatted[displayKey] = value;
    });

    return formatted;
  });
}

/**
 * Table configuration for different data types
 */
export const TABLE_CONFIGS: Record<string, {
  title: string;
  filename: string;
  headers: string[];
  columnHeaders: string[];
  columnMapping?: Record<string, string>;
}> = {
  users: {
    title: 'รายงานผู้ใช้ทั้งหมด',
    filename: 'users-report',
    headers: ['id', 'email', 'full_name', 'username', 'phone', 'role', 'created_at'],
    columnHeaders: ['ID', 'อีเมล', 'ชื่อ-นามสกุล', 'ชื่อผู้ใช้', 'เบอร์โทร', 'บทบาท', 'วันที่สร้าง'],
    columnMapping: {
      id: 'ID',
      email: 'อีเมล',
      full_name: 'ชื่อ-นามสกุล',
      username: 'ชื่อผู้ใช้',
      phone: 'เบอร์โทร',
      role: 'บทบาท',
      created_at: 'วันที่สร้าง',
    },
  },
  gyms: {
    title: 'รายงานยิมทั้งหมด',
    filename: 'gyms-report',
    headers: ['id', 'gym_name', 'gym_name_english', 'contact_name', 'email', 'phone', 'location', 'status', 'created_at'],
    columnHeaders: ['ID', 'ชื่อยิม (ไทย)', 'ชื่อยิม (อังกฤษ)', 'ชื่อผู้ติดต่อ', 'อีเมล', 'เบอร์โทร', 'ที่อยู่', 'สถานะ', 'วันที่สร้าง'],
    columnMapping: {
      id: 'ID',
      gym_name: 'ชื่อยิม (ไทย)',
      gym_name_english: 'ชื่อยิม (อังกฤษ)',
      contact_name: 'ชื่อผู้ติดต่อ',
      email: 'อีเมล',
      phone: 'เบอร์โทร',
      location: 'ที่อยู่',
      status: 'สถานะ',
      created_at: 'วันที่สร้าง',
    },
  },
  bookings: {
    title: 'รายงานการจอง',
    filename: 'bookings-report',
    headers: ['id', 'booking_number', 'customer_name', 'customer_email', 'customer_phone', 'gym_name', 'package_name', 'price_paid', 'start_date', 'end_date', 'payment_status', 'status', 'created_at'],
    columnHeaders: ['ID', 'เลขที่จอง', 'ชื่อลูกค้า', 'อีเมล', 'เบอร์โทร', 'ยิม', 'แพ็คเกจ', 'ราคา', 'วันที่เริ่ม', 'วันที่สิ้นสุด', 'สถานะการชำระ', 'สถานะ', 'วันที่สร้าง'],
    columnMapping: {
      id: 'ID',
      booking_number: 'เลขที่จอง',
      customer_name: 'ชื่อลูกค้า',
      customer_email: 'อีเมล',
      customer_phone: 'เบอร์โทร',
      gym_name: 'ยิม',
      package_name: 'แพ็คเกจ',
      price_paid: 'ราคา',
      start_date: 'วันที่เริ่ม',
      end_date: 'วันที่สิ้นสุด',
      payment_status: 'สถานะการชำระ',
      status: 'สถานะ',
      created_at: 'วันที่สร้าง',
    },
  },
  payments: {
    title: 'รายงานรายได้',
    filename: 'payments-report',
    headers: ['id', 'user_id', 'payment_type', 'amount', 'status', 'payment_method', 'stripe_payment_intent_id', 'created_at'],
    columnHeaders: ['ID', 'User ID', 'ประเภท', 'จำนวนเงิน', 'สถานะ', 'วิธีชำระ', 'Stripe ID', 'วันที่สร้าง'],
    columnMapping: {
      id: 'ID',
      user_id: 'User ID',
      payment_type: 'ประเภท',
      amount: 'จำนวนเงิน',
      status: 'สถานะ',
      payment_method: 'วิธีชำระ',
      stripe_payment_intent_id: 'Stripe ID',
      created_at: 'วันที่สร้าง',
    },
  },
};

