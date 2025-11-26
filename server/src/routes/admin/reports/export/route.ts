/**
 * Admin Reports Export API
 * POST /api/admin/reports/export
 * 
 * Exports data from any table to PDF or CSV format
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ExportRow = Record<string, unknown>;

// Allowed tables for export (security: prevent table enumeration)
const ALLOWED_TABLES = [
  'profiles',
  'user_roles',
  'hospitals',
  'hospital_packages',
  'appointments',
  'payments',
  'orders',
  'user_points',
  'points_history',
  'badges',
  'user_badges',
  'challenges',
  'user_challenges',
  'notifications',
  'user_favorites',
  'promotions',
  'partner_applications',
  'user_social_links',
  'user_fitness_goals',
  'user_privacy_settings',
  'user_notification_preferences',
];

// Table display names and column mappings
const TABLE_CONFIGS: Record<string, {
  title: string;
  filename: string;
  columns?: string[];
  columnHeaders?: string[];
}> = {
  profiles: {
    title: 'รายงานผู้ใช้ (Profiles)',
    filename: 'profiles',
    columns: ['user_id', 'username', 'full_name', 'phone', 'avatar_url', 'bio', 'created_at'],
    columnHeaders: ['User ID', 'ชื่อผู้ใช้', 'ชื่อ-นามสกุล', 'เบอร์โทร', 'Avatar URL', 'Bio', 'วันที่สร้าง'],
  },
  user_roles: {
    title: 'รายงานบทบาทผู้ใช้',
    filename: 'user-roles',
    columns: ['user_id', 'role', 'created_at', 'updated_at'],
    columnHeaders: ['User ID', 'บทบาท', 'วันที่สร้าง', 'วันที่อัปเดต'],
  },
  hospitals: {
    title: 'รายงานโรงพยาบาลทั้งหมด',
    filename: 'hospitals',
    columns: ['id', 'hospital_name', 'hospital_name_english', 'contact_name', 'email', 'phone', 'location', 'status', 'created_at'],
    columnHeaders: ['ID', 'ชื่อโรงพยาบาล (ไทย)', 'ชื่อโรงพยาบาล (อังกฤษ)', 'ชื่อผู้ติดต่อ', 'อีเมล', 'เบอร์โทร', 'ที่อยู่', 'สถานะ', 'วันที่สร้าง'],
  },
  hospital_packages: {
    title: 'รายงานแพ็คเกจ',
    filename: 'hospital-packages',
    columns: ['id', 'hospital_id', 'name', 'name_english', 'package_type', 'price', 'duration_months', 'is_active', 'created_at'],
    columnHeaders: ['ID', 'hospital ID', 'ชื่อ', 'ชื่อ (อังกฤษ)', 'ประเภท', 'ราคา', 'ระยะเวลา (เดือน)', 'สถานะ', 'วันที่สร้าง'],
  },
  appointments: {
    title: 'รายงานการจอง',
    filename: 'appointments',
    columns: ['id', 'booking_number', 'customer_name', 'customer_email', 'customer_phone', 'hospital_id', 'package_name', 'price_paid', 'start_date', 'end_date', 'payment_status', 'status', 'created_at'],
    columnHeaders: ['ID', 'เลขที่จอง', 'ชื่อลูกค้า', 'อีเมล', 'เบอร์โทร', 'hospital ID', 'แพ็คเกจ', 'ราคา', 'วันที่เริ่ม', 'วันที่สิ้นสุด', 'สถานะการชำระ', 'สถานะ', 'วันที่สร้าง'],
  },
  payments: {
    title: 'รายงานการชำระเงิน',
    filename: 'payments',
    columns: ['id', 'user_id', 'payment_type', 'amount', 'status', 'payment_method', 'stripe_payment_intent_id', 'created_at'],
    columnHeaders: ['ID', 'User ID', 'ประเภท', 'จำนวนเงิน', 'สถานะ', 'วิธีชำระ', 'Stripe ID', 'วันที่สร้าง'],
  },
  orders: {
    title: 'รายงานคำสั่งซื้อ',
    filename: 'orders',
    columns: ['id', 'user_id', 'order_number', 'status', 'total_amount', 'payment_id', 'created_at'],
    columnHeaders: ['ID', 'User ID', 'เลขที่ออเดอร์', 'สถานะ', 'ยอดรวม', 'Payment ID', 'วันที่สร้าง'],
  },
  user_points: {
    title: 'รายงานคะแนนผู้ใช้',
    filename: 'user-points',
    columns: ['id', 'user_id', 'total_points', 'current_level', 'points_to_next_level', 'updated_at'],
    columnHeaders: ['ID', 'User ID', 'คะแนนรวม', 'เลเวลปัจจุบัน', 'คะแนนถึงเลเวลถัดไป', 'วันที่อัปเดต'],
  },
  points_history: {
    title: 'รายงานประวัติคะแนน',
    filename: 'points-history',
    columns: ['id', 'user_id', 'points', 'action_type', 'action_description', 'reference_type', 'reference_id', 'created_at'],
    columnHeaders: ['ID', 'User ID', 'คะแนน', 'ประเภทการกระทำ', 'คำอธิบาย', 'Reference Type', 'Reference ID', 'วันที่สร้าง'],
  },
  badges: {
    title: 'รายงานเหรียญ',
    filename: 'badges',
    columns: ['id', 'name', 'name_english', 'description', 'icon_url', 'points_required', 'is_active', 'created_at'],
    columnHeaders: ['ID', 'ชื่อ', 'ชื่อ (อังกฤษ)', 'คำอธิบาย', 'Icon URL', 'คะแนนที่ต้องการ', 'สถานะ', 'วันที่สร้าง'],
  },
  user_badges: {
    title: 'รายงานเหรียญผู้ใช้',
    filename: 'user-badges',
    columns: ['id', 'user_id', 'badge_id', 'earned_at'],
    columnHeaders: ['ID', 'User ID', 'Badge ID', 'วันที่ได้รับ'],
  },
  challenges: {
    title: 'รายงานความท้าทาย',
    filename: 'challenges',
    columns: ['id', 'name', 'name_english', 'description', 'points_reward', 'start_date', 'end_date', 'is_active', 'created_at'],
    columnHeaders: ['ID', 'ชื่อ', 'ชื่อ (อังกฤษ)', 'คำอธิบาย', 'รางวัลคะแนน', 'วันที่เริ่ม', 'วันที่สิ้นสุด', 'สถานะ', 'วันที่สร้าง'],
  },
  notifications: {
    title: 'รายงานการแจ้งเตือน',
    filename: 'notifications',
    columns: ['id', 'user_id', 'type', 'title', 'message', 'is_read', 'read_at', 'created_at'],
    columnHeaders: ['ID', 'User ID', 'ประเภท', 'หัวข้อ', 'ข้อความ', 'อ่านแล้ว', 'วันที่อ่าน', 'วันที่สร้าง'],
  },
  user_favorites: {
    title: 'รายงานรายการโปรด',
    filename: 'user-favorites',
    columns: ['id', 'user_id', 'item_type', 'item_id', 'created_at'],
    columnHeaders: ['ID', 'User ID', 'ประเภท', 'Item ID', 'วันที่สร้าง'],
  },
  promotions: {
    title: 'รายงานโปรโมชั่น',
    filename: 'promotions',
    columns: ['id', 'title', 'description', 'discount_type', 'discount_value', 'start_date', 'end_date', 'is_active', 'created_at'],
    columnHeaders: ['ID', 'หัวข้อ', 'คำอธิบาย', 'ประเภทส่วนลด', 'ค่าส่วนลด', 'วันที่เริ่ม', 'วันที่สิ้นสุด', 'สถานะ', 'วันที่สร้าง'],
  },
  partner_applications: {
    title: 'รายงานใบสมัคร Partner',
    filename: 'partner-applications',
    columns: ['id', 'user_id', 'hospital_name', 'status', 'submitted_at', 'reviewed_at'],
    columnHeaders: ['ID', 'User ID', 'ชื่อโรงพยาบาล', 'สถานะ', 'วันที่ส่ง', 'วันที่ตรวจสอบ'],
  },
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json() as {
      table?: string;
      format?: string;
      filters?: Record<string, unknown>;
    };
    const { table, format, filters } = body;

    if (!table || !format) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: table, format' },
        { status: 400 }
      );
    }

    // Validate table name
    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { success: false, error: 'Invalid table name' },
        { status: 400 }
      );
    }

    // Validate format
    if (!['pdf', 'csv'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Must be "pdf" or "csv"' },
        { status: 400 }
      );
    }

    // Get table config
    const config = TABLE_CONFIGS[table] || {
      title: `รายงาน ${table}`,
      filename: table,
    };

    // Fetch data from table
    let query = supabase.from(table).select('*');

    // Apply filters if provided
    if (filters) {
      if (filters.dateFrom && filters.dateTo) {
        query = query
          .gte('created_at', filters.dateFrom)
          .lte('created_at', filters.dateTo);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching data:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch data' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data found' },
        { status: 404 }
      );
    }

    // Format data for export
    const formattedData = formatDataForExport(data, config.columns, config.columnHeaders);

    if (format === 'csv') {
      return exportAsCSV(formattedData, config.filename, config.columnHeaders || config.columns || []);
    } else {
      return exportAsPDF(formattedData, config.title, config.filename, config.columns || [], config.columnHeaders || []);
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Format data for export
 */
function formatDataForExport(
  data: ExportRow[],
  columns?: string[],
  columnHeaders?: string[]
): ExportRow[] {
  const columnKeys = columns && columns.length > 0
    ? columns
    : Object.keys((data[0] ?? {}) as ExportRow);

  return data.map((row) => {
    const formatted: ExportRow = {};
    
    columnKeys.forEach((col, index) => {
      let value: unknown = row[col];
      
      if (Array.isArray(value)) {
        value = value.join(', ');
      }
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const recordValue = value as Record<string, unknown>;
        const primary =
          recordValue.hospital_name ??
          recordValue.full_name ??
          recordValue.email ??
          recordValue.name;

        value = primary ?? JSON.stringify(recordValue).substring(0, 100);
      }

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

      const headerKey = columnHeaders?.[index] || col;
      formatted[headerKey] = value ?? '';
    });

    return formatted;
  });
}

/**
 * Export as CSV
 */
function exportAsCSV(data: ExportRow[], filename: string, headers: string[]): NextResponse {
  if (data.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No data to export' },
      { status: 400 }
    );
  }

  // Get headers from first row if not provided
  const csvHeaders = headers.length > 0 ? headers : Object.keys(data[0]);

  // Create CSV content
  const csvRows: string[] = [];
  csvRows.push(csvHeaders.map((h) => escapeCSV(h)).join(','));

  data.forEach((row) => {
    const values = csvHeaders.map((header) => {
      const value = row[header] ?? '';
      return escapeCSV(String(value));
    });
    csvRows.push(values.join(','));
  });

  const csvContent = '\ufeff' + csvRows.join('\n'); // BOM for Excel

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

/**
 * Export as PDF
 */
function exportAsPDF(
  data: ExportRow[],
  title: string,
  filename: string,
  columns: string[],
  columnHeaders: string[]
): NextResponse {
  if (data.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No data to export' },
      { status: 400 }
    );
  }

  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Add export date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString('th-TH')}`, 14, 30);
  doc.text(`Total Records: ${data.length}`, 14, 37);

  // Prepare table data
  const headers = columnHeaders.length > 0 ? columnHeaders : columns.map((c) => c.toUpperCase().replace(/_/g, ' '));
  const tableData = data.map((row) => {
    const headerKeys = columnHeaders.length > 0 ? columnHeaders : columns;
    return headerKeys.map((header) => {
      const value = row[header] ?? '';
      return String(value).substring(0, 50); // Limit length for PDF
    });
  });

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 42,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [220, 53, 69], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 42 },
  });

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  });
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

