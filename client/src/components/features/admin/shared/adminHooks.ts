/**
 * Shared hooks for admin components
 * Provides common state management and data fetching patterns
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { createClient } from '@shared/lib/database/supabase/client';
import { 
  makeApiCall, 
  filterBySearch, 
  filterByStatus, 
  debounce,
  ADMIN_TOAST_MESSAGES 
} from './adminUtils';

/**
 * Generic hook for managing admin data with CRUD operations
 */
export function useAdminData<T extends { id: string; status?: string }>(
  tableName: string,
  apiEndpoint: string
) {
  const supabase = createClient();
  const [items, setItems] = useState<T[]>([]);
  const [filteredItems, setFilteredItems] = useState<T[]>([]);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load items from database
  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setItems(data);
      }
    } catch (error) {
      console.error(`Error loading ${tableName}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, tableName]);

  // Filter items based on search and status
  useEffect(() => {
    let filtered = items;

    // Filter by status
    filtered = filterByStatus(filtered, selectedTab);

    // Filter by search query
    if (searchQuery) {
      // Default search fields - can be customized per usage
      const searchFields: (keyof T)[] = ['name', 'title', 'hospital_name', 'contact_name'] as (keyof T)[];
      filtered = filterBySearch(filtered, searchQuery, searchFields);
    }

    setFilteredItems(filtered);
  }, [items, selectedTab, searchQuery]);

  // Generic CRUD operations
  const createItem = useCallback(async (data: Partial<T>) => {
    setIsProcessing(true);
    const result = await makeApiCall(
      apiEndpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      ADMIN_TOAST_MESSAGES.SAVE_SUCCESS
    );
    
    if (result.success) {
      await loadItems();
    }
    
    setIsProcessing(false);
    return result.success;
  }, [apiEndpoint, loadItems]);

  const updateItem = useCallback(async (id: string, data: Partial<T>) => {
    setIsProcessing(true);
    const result = await makeApiCall(
      `${apiEndpoint}/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      ADMIN_TOAST_MESSAGES.SAVE_SUCCESS
    );
    
    if (result.success) {
      await loadItems();
    }
    
    setIsProcessing(false);
    return result.success;
  }, [apiEndpoint, loadItems]);

  const deleteItem = useCallback(async (id: string) => {
    setIsProcessing(true);
    const result = await makeApiCall(
      `${apiEndpoint}/${id}`,
      {
        method: 'DELETE',
      },
      ADMIN_TOAST_MESSAGES.DELETE_SUCCESS
    );
    
    if (result.success) {
      await loadItems();
    }
    
    setIsProcessing(false);
    return result.success;
  }, [apiEndpoint, loadItems]);

  const approveItem = useCallback(async (id: string) => {
    return await updateItem(id, { status: 'approved' } as Partial<T>);
  }, [updateItem]);

  const rejectItem = useCallback(async (id: string) => {
    return await updateItem(id, { status: 'rejected' } as Partial<T>);
  }, [updateItem]);

  return {
    // State
    items,
    filteredItems,
    selectedItem,
    searchQuery,
    selectedTab,
    isLoading,
    isProcessing,

    // Setters
    setSelectedItem,
    setSearchQuery,
    setSelectedTab,

    // Actions
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    approveItem,
    rejectItem,
  };
}

/**
 * Hook for managing search with debouncing
 */
export function useAdminSearch(delay: number = 300) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const debouncedSetQuery = useMemo(
    () => debounce((query: unknown) => {
      if (typeof query === 'string') {
        setDebouncedQuery(query);
      }
    }, delay),
    [delay]
  );

  useEffect(() => {
    debouncedSetQuery(searchQuery);
  }, [searchQuery, debouncedSetQuery]);

  return {
    searchQuery,
    debouncedQuery,
    setSearchQuery,
  };
}

/**
 * Hook for managing modal states
 */
export function useAdminModals() {
  const [modals, setModals] = useState({
    detail: false,
    edit: false,
    delete: false,
    create: false,
  });

  const openModal = useCallback((modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  }, []);

  const closeModal = useCallback((modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals({
      detail: false,
      edit: false,
      delete: false,
      create: false,
    });
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
  };
}

/**
 * Hook for managing form state with validation
 */
export function useAdminForm<T extends Record<string, unknown>>(
  initialData: T,
  validationRules?: Array<{ field: keyof T; validator: (value: unknown) => string | undefined }>
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isDirty, setIsDirty] = useState(false);

  const updateField = useCallback((field: keyof T, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Validate field if rules provided
    if (validationRules) {
      const rule = validationRules.find(r => r.field === field);
      if (rule) {
        const error = rule.validator(value);
        setErrors(prev => ({
          ...prev,
          [field]: error,
        }));
      }
    }
  }, [validationRules]);

  const validateForm = useCallback(() => {
    if (!validationRules) return true;

    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    validationRules.forEach(({ field, validator }) => {
      const error = validator(formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validationRules]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setIsDirty(false);
  }, [initialData]);

  const isFormValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    formData,
    errors,
    isDirty,
    isFormValid,
    updateField,
    validateForm,
    resetForm,
    setFormData,
  };
}

/**
 * Hook for managing table state (sorting, pagination, etc.)
 */
export function useAdminTable<T>(items: T[], pageSize: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const sortedItems = useMemo(() => {
    if (!sortField) return items;

    return [...items].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortField, sortDirection]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedItems.slice(startIndex, startIndex + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  const totalPages = Math.ceil(items.length / pageSize);

  const handleSort = useCallback((field: keyof T) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  }, [sortField]);

  return {
    currentPage,
    totalPages,
    sortField,
    sortDirection,
    paginatedItems,
    setCurrentPage,
    handleSort,
  };
}