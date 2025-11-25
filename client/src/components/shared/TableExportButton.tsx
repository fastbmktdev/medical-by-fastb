/**
 * TableExportButton Component
 * ปุ่มสำหรับ export table data เป็น PDF/CSV
 * ใช้ได้กับทุก table ในระบบ
 */

'use client';

import { useCallback, memo } from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { ArrowDownTrayIcon, DocumentIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { useTableExport, type UseTableExportOptions } from '@shared/lib/hooks/useTableExport';

export interface TableExportButtonProps<T = Record<string, unknown>> {
  /**
   * ตัวเลือกสำหรับ export
   */
  exportOptions: Omit<UseTableExportOptions<T>, 'options'> & {
    options?: UseTableExportOptions<T>['options'];
  };
  
  /**
   * ขนาดของปุ่ม
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * สี variant ของปุ่ม
   */
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost';
  
  /**
   * สีของปุ่ม
   */
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  
  /**
   * แสดงเฉพาะ icon หรือไม่
   */
  iconOnly?: boolean;
  
  /**
   * Text ของปุ่ม (ถ้าไม่ใช้ iconOnly)
   */
  buttonText?: string;
  
  /**
   * CSS class เพิ่มเติม
   */
  className?: string;
  
  /**
   * Disable ปุ่มหรือไม่
   */
  disabled?: boolean;
}

/**
 * Component สำหรับปุ่ม export table
 * 
 * @example
 * ```tsx
 * <TableExportButton
 *   exportOptions={{
 *     data: appointments,
 *     columns: [
 *       { key: 'id', label: 'ID' },
 *       { key: 'customer_name', label: 'ชื่อลูกค้า' },
 *     ],
 *     filename: 'appointments-report',
 *     title: 'รายงานการจอง',
 *   }}
 * />
 * ```
 */
function TableExportButtonComponent<T = Record<string, unknown>>({
  exportOptions,
  size = 'md',
  variant = 'bordered',
  color = 'default',
  iconOnly = false,
  buttonText = 'Export',
  className = '',
  disabled = false,
}: TableExportButtonProps<T>) {
  const { exportPDF, exportCSV, isExporting } = useTableExport(exportOptions);

  const handleExport = useCallback(async (format: 'pdf' | 'csv') => {
    if (format === 'pdf') {
      await exportPDF();
    } else {
      await exportCSV();
    }
  }, [exportPDF, exportCSV]);

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant={variant}
          color={color}
          size={size}
          isLoading={isExporting}
          isDisabled={disabled || isExporting}
          startContent={!isExporting && <ArrowDownTrayIcon className="w-4 h-4" />}
          className={className}
        >
          {!iconOnly && !isExporting && buttonText}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Export options"
        onAction={(key) => handleExport(key as 'pdf' | 'csv')}
      >
        <DropdownItem
          key="pdf"
          startContent={<DocumentIcon className="w-4 h-4" />}
          description="Export as PDF document"
        >
          Export as PDF
        </DropdownItem>
        <DropdownItem
          key="csv"
          startContent={<TableCellsIcon className="w-4 h-4" />}
          description="Export as CSV spreadsheet"
        >
          Export as CSV
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}

export const TableExportButton = memo(TableExportButtonComponent) as <T = Record<string, unknown>>(
  props: TableExportButtonProps<T>
) => React.ReactNode;

/**
 * Simple Export Buttons (แยกปุ่มแทน dropdown)
 */
export interface SimpleExportButtonsProps<T = Record<string, unknown>> {
  exportOptions: UseTableExportOptions<T>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabels?: boolean;
}

function SimpleExportButtonsComponent<T = Record<string, unknown>>({
  exportOptions,
  size = 'sm',
  className = '',
  showLabels = true,
}: SimpleExportButtonsProps<T>) {
  const { exportPDF, exportCSV, isExporting } = useTableExport(exportOptions);

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        size={size}
        variant="bordered"
        color="danger"
        isLoading={isExporting}
        onPress={exportPDF}
        startContent={!isExporting && <DocumentIcon className="w-4 h-4" />}
      >
        {showLabels && 'PDF'}
      </Button>
      <Button
        size={size}
        variant="bordered"
        color="success"
        isLoading={isExporting}
        onPress={exportCSV}
        startContent={!isExporting && <TableCellsIcon className="w-4 h-4" />}
      >
        {showLabels && 'CSV'}
      </Button>
    </div>
  );
}

export const SimpleExportButtons = memo(SimpleExportButtonsComponent) as <T = Record<string, unknown>>(
  props: SimpleExportButtonsProps<T>
) => React.ReactNode;

