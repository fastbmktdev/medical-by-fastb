/**
 * useTableExport Hook
 * Universal hook for exporting table data to PDF/CSV formats
 * ใช้ได้กับทุก table ในระบบ
 */

import { useCallback, useState } from 'react';
import { exportToPDF, exportToCSV, type ExportColumn } from '@shared/lib/utils/export';


export interface UseTableExportOptions<T = Record<string, unknown>> {
  /**
   * ข้อมูลที่จะ export
   */
  data: T[];
  
  /**
   * คอลัมน์ที่จะ export (ถ้าไม่ใส่จะใช้ทั้งหมด)
   */
  columns?: ExportColumn<T>[];
  
  /**
   * ชื่อไฟล์ (ไม่ต้องใส่ extension)
   */
  filename: string;
  
  /**
   * หัวข้อของ PDF (optional)
   */
  title?: string;
  
  /**
   * Subtitle ของ PDF (optional)
   */
  subtitle?: string;
  
  /**
   * การปรับแต่งเพิ่มเติม
   */
  options?: {
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'a4' | 'letter' | 'legal';
    includeTimestamp?: boolean;
    includeRowNumbers?: boolean;
  };
}

export interface UseTableExportReturn {
  /**
   * Export เป็น PDF
   */
  exportPDF: () => Promise<void>;
  
  /**
   * Export เป็น CSV
   */
  exportCSV: () => Promise<void>;
  
  /**
   * สถานะกำลัง export อยู่หรือไม่
   */
  isExporting: boolean;
  
  /**
   * Error message (ถ้ามี)
   */
  error: string | null;
}

/**
 * Hook สำหรับ export table data
 * 
 * @example
 * ```tsx
 * const { exportPDF, exportCSV, isExporting } = useTableExport({
 *   data: appointments,
 *   columns: [
 *     { key: 'id', label: 'ID' },
 *     { key: 'customer_name', label: 'ชื่อลูกค้า' },
 *   ],
 *   filename: 'appointments-report',
 *   title: 'รายงานการจอง',
 * });
 * ```
 */
export function useTableExport<T = Record<string, unknown>>({
  data,
  columns,
  filename,
  title,
  subtitle,
  options = {},
}: UseTableExportOptions<T>): UseTableExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPDF = useCallback(async () => {
    try {
      setIsExporting(true);
      setError(null);

      if (!data || data.length === 0) {
        console.error('ไม่มีข้อมูลสำหรับ export');
        return;
      }

      await exportToPDF({
        data,
        columns,
        filename,
        title,
        subtitle,
        orientation: options.orientation || 'landscape',
        pageSize: options.pageSize || 'a4',
        includeTimestamp: options.includeTimestamp ?? true,
        includeRowNumbers: options.includeRowNumbers ?? true,
      });

      console.log('Export PDF สำเร็จ!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการ export PDF';
      setError(message);
      console.error(message);
      console.error('Export PDF error:', err);
    } finally {
      setIsExporting(false);
    }
  }, [data, columns, filename, title, subtitle, options]);

  const exportCSV = useCallback(async () => {
    try {
      setIsExporting(true);
      setError(null);

      if (!data || data.length === 0) {
        console.error('ไม่มีข้อมูลสำหรับ export');
        return;
      }

      await exportToCSV({
        data,
        columns,
        filename,
        includeTimestamp: options.includeTimestamp ?? true,
      });

      console.log('Export CSV สำเร็จ!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการ export CSV';
      setError(message);
      console.error(message);
      console.error('Export CSV error:', err);
    } finally {
      setIsExporting(false);
    }
  }, [data, columns, filename, options.includeTimestamp]);

  return {
    exportPDF,
    exportCSV,
    isExporting,
    error,
  };
}

