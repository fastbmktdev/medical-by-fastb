'use client';

import { useState, memo, useMemo, useCallback } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Loading } from '@/components/design-system/primitives/Loading';
// import { Button } from '@/components/design-system/primitives/Button';
import { EmptyState } from './EmptyState';
import { DataTableProps } from './types';
import { TableExportButton } from '@/components/shared/TableExportButton';

function DataTableImpl<T = Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyText = 'No data available',
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  exportConfig,
  topContent,
  className = '',
  testId = 'data-table',
  ...props
}: DataTableProps<T>) {
  const [internalSortBy, setInternalSortBy] = useState<string | undefined>(sortBy);
  const [internalSortOrder, setInternalSortOrder] = useState<'asc' | 'desc'>('asc');

  const currentSortBy = sortBy ?? internalSortBy;
  const currentSortOrder = sortOrder ?? internalSortOrder;

  const handleSort = useCallback((columnKey: string) => {
    const newOrder = currentSortBy === columnKey && currentSortOrder === 'asc' ? 'desc' : 'asc';
    
    if (onSort) {
      onSort(columnKey, newOrder);
    } else {
      setInternalSortBy(columnKey);
      setInternalSortOrder(newOrder);
    }
  }, [currentSortBy, currentSortOrder, onSort]);

  const sortedData = useMemo(() => {
    if (!currentSortBy) return data;

    return [...data].sort((a, b) => {
      const aRecord = a as Record<string, unknown>;
      const bRecord = b as Record<string, unknown>;
      const aValue = aRecord[currentSortBy];
      const bValue = bRecord[currentSortBy];

      if (aValue === bValue) return 0;

      // Convert to comparable values
      const aStr = String(aValue ?? '');
      const bStr = String(bValue ?? '');
      const comparison = aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      return currentSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, currentSortBy, currentSortOrder]);

  // เตรียม export columns จาก table columns (ต้องอยู่ก่อน early returns)
  const exportColumns = useMemo(() => {
    if (exportConfig?.columns) return exportConfig.columns;
    
    return columns.map(col => ({
      key: col.key,
      label: col.title,
      format: col.render 
        ? (value: unknown, row: T) => {
            const rendered = col.render!(value, row, 0);
            // แปลง ReactNode เป็น string สำหรับ export
            if (typeof rendered === 'string') return rendered;
            if (typeof rendered === 'number') return String(rendered);
            return String(value ?? '');
          }
        : undefined,
    }));
  }, [columns, exportConfig?.columns]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="No Data"
        description={emptyText}
        variant="default"
      />
    );
  }

  return (
    <div className={className}>
      {/* Top Bar with Export Button */}
      {(exportConfig?.enabled || topContent) && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            {topContent}
          </div>
          {exportConfig?.enabled && (
            <TableExportButton
              exportOptions={{
                data: sortedData,
                columns: exportColumns,
                filename: exportConfig.filename,
                title: exportConfig.title,
                subtitle: exportConfig.subtitle,
                options: exportConfig.options,
              }}
              size="sm"
              variant="bordered"
              color="default"
            />
          )}
        </div>
      )}

      {/* Table Container */}
      <div
        className={`
          overflow-hidden  border border-zinc-700/70 bg-zinc-900/70
          shadow-2xl ring-1 ring-zinc-500/20 backdrop-blur-md
        `}
        data-testid={testId}
        {...props}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
          {/* Header */}
          <thead className="bg-zinc-900/80 border-b border-zinc-700/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-6 py-4 text-left text-sm font-semibold text-zinc-100
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                    ${column.sortable ? 'cursor-pointer hover:bg-zinc-800' : ''}
                  `}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  data-testid={`${testId}-header-${column.key}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUpIcon 
                          className={`w-3 h-3 ${
                            currentSortBy === column.key && currentSortOrder === 'asc'
                              ? 'text-red-400'
                              : 'text-zinc-500'
                          }`}
                        />
                        <ChevronDownIcon 
                          className={`w-3 h-3 -mt-1 ${
                            currentSortBy === column.key && currentSortOrder === 'desc'
                              ? 'text-red-400'
                              : 'text-zinc-500'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-zinc-100/80 divide-y divide-zinc-700/70">
            {sortedData.map((record, index) => (
              <tr
                key={index}
                className={`
                  group transition-colors duration-200
                  hover:bg-zinc-800/40 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
                onClick={onRowClick ? () => onRowClick(record, index) : undefined}
                data-testid={`${testId}-row-${index}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      px-6 py-4 text-sm text-zinc-300
                      transition-colors duration-200
                      group-hover:text-zinc-100
                      ${column.align === 'center' ? 'text-center' : ''}
                      ${column.align === 'right' ? 'text-right' : ''}
                    `}
                    data-testid={`${testId}-cell-${index}-${column.key}`}
                  >
                    {column.render
                      ? column.render((record as Record<string, unknown>)[column.key], record, index)
                      : String((record as Record<string, unknown>)[column.key] ?? '')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

const DataTableComponent = memo(DataTableImpl);

// Properly typed export to preserve generics
export const DataTable = DataTableComponent as <T = Record<string, unknown>>(props: DataTableProps<T>) => React.ReactElement;