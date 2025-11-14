import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showItemsPerPage?: boolean;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  className?: string;
}

/**
 * Pagination Component
 * 
 * A comprehensive pagination component with page navigation and items per page selector
 * 
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   totalItems={100}
 *   itemsPerPage={10}
 *   onPageChange={(page) => setCurrentPage(page)}
 *   showItemsPerPage
 *   onItemsPerPageChange={(items) => setItemsPerPage(items)}
 * />
 * ```
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showItemsPerPage = false,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
  className = '',
}: PaginationProps) {
  // Calculate range of items being displayed
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 7; // Show max 7 page buttons

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1 && !showItemsPerPage) {
    return null; // Don't show pagination if only one page and no items per page selector
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Items info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        แสดง <span className="font-medium text-gray-900 dark:text-white">{startItem}</span> ถึง{' '}
        <span className="font-medium text-gray-900 dark:text-white">{endItem}</span> จาก{' '}
        <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span> รายการ
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Items per page selector */}
        {showItemsPerPage && onItemsPerPageChange && (
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">แสดง:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="รายการต่อหน้า"
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400"
                >
                  ...
                </span>
              );
            }

            const pageNumber = page as number;
            const isCurrentPage = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`
                  min-w-10 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                  ${
                    isCurrentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
                aria-label={`หน้า ${pageNumber}`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="หน้าถัดไป"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Hook for managing pagination state
 * 
 * @example
 * ```tsx
 * const pagination = usePagination({
 *   totalItems: data.length,
 *   initialPage: 1,
 *   initialItemsPerPage: 10,
 * });
 * 
 * const paginatedData = data.slice(
 *   pagination.startIndex,
 *   pagination.endIndex
 * );
 * ```
 */
export function usePagination({
  totalItems,
  initialPage = 1,
  initialItemsPerPage = 10,
}: {
  totalItems: number;
  initialPage?: number;
  initialItemsPerPage?: number;
}) {
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage);

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Calculate start and end indices for slicing data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Reset to page 1 if current page exceeds total pages
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    setCurrentPage,
    setItemsPerPage: handleItemsPerPageChange,
  };
}

