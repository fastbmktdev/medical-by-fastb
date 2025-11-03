import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { makeApiCall, filterBySearch, filterByStatus } from '../shared/adminUtils';
import type { Gym } from '@/types';
import { TOAST_MESSAGES } from '.';

export function useGymManagement() {
  const supabase = createClient();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [filteredGyms, setFilteredGyms] = useState<Gym[]>([]);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load gyms from Supabase
  const loadGyms = useCallback(async () => {
    try {
      const { data: gymsData } = await supabase
        .from('gyms')
        .select('*')
        .order('created_at', { ascending: false });

      if (gymsData) {
        setGyms(gymsData);
      }
    } catch (error) {
      console.error('Error loading gyms:', error);
      // Error handling - could add toast notification here if needed
      console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลยิม');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Filter gyms by status and search query
  useEffect(() => {
    let filtered = gyms;

    // Filter by status tab
    filtered = filterByStatus(filtered, selectedTab);

    // Filter by search query
    if (searchQuery) {
      const searchFields: (keyof Gym)[] = ['gym_name', 'contact_name', 'phone', 'location'];
      filtered = filterBySearch(filtered, searchQuery, searchFields);
    }

    setFilteredGyms(filtered);
  }, [gyms, selectedTab, searchQuery]);

  // Generic handler for API operations with loading state
  const handleApiOperation = async (
    url: string,
    options: RequestInit,
    successMessage: string
  ) => {
    setIsProcessing(true);
    const result = await makeApiCall(url, options, successMessage);
    if (result.success) await loadGyms();
    setIsProcessing(false);
    return result.success;
  };

  // Handle approve gym
  const handleApprove = (gymId: string) =>
    handleApiOperation(
      `/api/partner-applications/${gymId}`,
      { method: 'PATCH', body: JSON.stringify({ status: 'approved' }) },
      TOAST_MESSAGES.APPROVE_SUCCESS
    );

  // Handle reject gym
  const handleReject = (gymId: string) =>
    handleApiOperation(
      `/api/partner-applications/${gymId}`,
      { method: 'PATCH', body: JSON.stringify({ status: 'denied' }) },
      TOAST_MESSAGES.REJECT_SUCCESS
    );

  // Handle edit gym
  const handleEdit = (gymId: string, data: Partial<Gym>) =>
    handleApiOperation(
      `/api/gyms/${gymId}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      TOAST_MESSAGES.EDIT_SUCCESS
    );

  // Handle delete gym
  const handleDelete = (gymId: string) =>
    handleApiOperation(
      `/api/gyms/${gymId}`,
      { method: 'DELETE' },
      TOAST_MESSAGES.DELETE_SUCCESS
    );

  return {
    // State
    gyms,
    filteredGyms,
    selectedGym,
    searchQuery,
    selectedTab,
    isLoading,
    isProcessing,

    // Setters
    setSelectedGym,
    setSearchQuery,
    setSelectedTab,

    // Actions
    loadGyms,
    handleApprove,
    handleReject,
    handleEdit,
    handleDelete,
  };
}
