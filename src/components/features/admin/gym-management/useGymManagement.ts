import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { showSuccessToast, showErrorToast } from '@/lib/utils';
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
      showErrorToast('เกิดข้อผิดพลาดในการโหลดข้อมูลยิม');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Filter gyms by status and search query
  useEffect(() => {
    let filtered = gyms;

    // Filter by status tab
    if (selectedTab !== 'all') {
      filtered = filtered.filter((gym) => gym.status === selectedTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (gym) =>
          gym.gym_name.toLowerCase().includes(query) ||
          gym.contact_name.toLowerCase().includes(query) ||
          gym.phone.includes(query) ||
          gym.location.toLowerCase().includes(query)
      );
    }

    setFilteredGyms(filtered);
  }, [gyms, selectedTab, searchQuery]);

  // Handle approve gym
  const handleApprove = async (gymId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/partner-applications/${gymId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      const result = await response.json();

      if (result.success) {
        await loadGyms();
        showSuccessToast(TOAST_MESSAGES.APPROVE_SUCCESS);
        return true;
      } else {
        showErrorToast('เกิดข้อผิดพลาด: ' + result.error);
        return false;
      }
    } catch (error) {
      console.error('Error approving gym:', error);
      showErrorToast('เกิดข้อผิดพลาดในการอนุมัติยิม');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject gym
  const handleReject = async (gymId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/partner-applications/${gymId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'denied' }),
      });

      const result = await response.json();

      if (result.success) {
        await loadGyms();
        showSuccessToast(TOAST_MESSAGES.REJECT_SUCCESS);
        return true;
      } else {
        showErrorToast('เกิดข้อผิดพลาด: ' + result.error);
        return false;
      }
    } catch (error) {
      console.error('Error rejecting gym:', error);
      showErrorToast('เกิดข้อผิดพลาดในการปฏิเสธยิม');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle edit gym
  const handleEdit = async (gymId: string, data: Partial<Gym>) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/gyms/${gymId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        await loadGyms();
        showSuccessToast(TOAST_MESSAGES.EDIT_SUCCESS);
        return true;
      } else {
        showErrorToast('เกิดข้อผิดพลาด: ' + (result.error || 'Unknown error'));
        return false;
      }
    } catch (error) {
      console.error('Error editing gym:', error);
      showErrorToast('เกิดข้อผิดพลาดในการแก้ไขข้อมูลยิม');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete gym
  const handleDelete = async (gymId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/gyms/${gymId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await loadGyms();
        showSuccessToast(TOAST_MESSAGES.DELETE_SUCCESS);
        return true;
      } else {
        showErrorToast('เกิดข้อผิดพลาด: ' + result.error);
        return false;
      }
    } catch (error) {
      console.error('Error deleting gym:', error);
      showErrorToast('เกิดข้อผิดพลาดในการลบยิม');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

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
