import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { createClient } from '@shared/lib/database/supabase/client';
import { makeApiCall, filterBySearch, filterByStatus } from '../shared/adminUtils';
import type { hospital } from '@shared/types';
import { TOAST_MESSAGES } from '.';
import { useDebouncedValue } from '@shared/lib/hooks';

export function useHospitalManagement() {
  const supabase = createClient();
  const [hospitals, setHospitals] = useState<hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<hospital | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search query with 300ms delay
  const { debouncedValue: debouncedSearchQuery, isDebouncing } = useDebouncedValue(searchQuery, 300);

  // Load hospitals from Supabase
  const loadHospitals = useCallback(async () => {
    try {
      const { data: hospitalsData } = await supabase
        .from('hospitals')
        .select('*')
        .order('created_at', { ascending: false });

      if (hospitalsData) {
        setHospitals(hospitalsData);
      }
    } catch (error) {
      console.error('Error loading hospitals:', error);
      // Error handling - could add toast notification here if needed
      console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลโรงพยาบาล');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Filter hospitals by status and search query (using debounced search)
  useEffect(() => {
    let filtered = hospitals;

    // Filter by status tab
    filtered = filterByStatus(filtered, selectedTab);

    // Filter by search query (debounced)
    if (debouncedSearchQuery) {
      const searchFields: (keyof hospital)[] = ['hospital_name', 'contact_name', 'phone', 'location'];
      filtered = filterBySearch(filtered, debouncedSearchQuery, searchFields);
    }

    setFilteredHospitals(filtered);
  }, [hospitals, selectedTab, debouncedSearchQuery]);

  // Generic handler for API operations with loading state
  const handleApiOperation = async (
    url: string,
    options: RequestInit,
    successMessage: string
  ) => {
    setIsProcessing(true);
    const result = await makeApiCall(url, options, successMessage);
    if (result.success) await loadHospitals();
    setIsProcessing(false);
    return result.success;
  };

  // Handle approve hospital
  const handleApprove = (hospitalId: string) =>
    handleApiOperation(
      `/api/partner-applications/${hospitalId}`,
      { method: 'PATCH', body: JSON.stringify({ status: 'approved' }) },
      TOAST_MESSAGES.APPROVE_SUCCESS
    );

  // Handle reject hospital
  const handleReject = (hospitalId: string) =>
    handleApiOperation(
      `/api/partner-applications/${hospitalId}`,
      { method: 'PATCH', body: JSON.stringify({ status: 'denied' }) },
      TOAST_MESSAGES.REJECT_SUCCESS
    );

  // Handle edit hospital
  const handleEdit = (hospitalId: string, data: Partial<hospital>) =>
    handleApiOperation(
      `/api/hospitals/${hospitalId}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      TOAST_MESSAGES.EDIT_SUCCESS
    );

  // Handle delete hospital
  const handleDelete = (hospitalId: string) =>
    handleApiOperation(
      `/api/hospitals/${hospitalId}`,
      { method: 'DELETE' },
      TOAST_MESSAGES.DELETE_SUCCESS
    );

  const exportHospitals = useCallback(async () => {
    if (!filteredHospitals.length) {
      toast.error('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const escapeCsvValue = (value: unknown) => {
      if (value === null || value === undefined) {
        return '""';
      }
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    };

    setIsExporting(true);

    try {
      const headers = [
        'ชื่อโรงพยาบาล',
        'ผู้ติดต่อ',
        'โทรศัพท์',
        'อีเมล',
        'สถานที่',
        'สถานะ',
        'วันที่สร้าง',
      ];

      const rows = filteredHospitals.map((hospital) => [
        escapeCsvValue(hospital.hospital_name),
        escapeCsvValue(hospital.contact_name),
        escapeCsvValue(hospital.phone),
        escapeCsvValue(hospital.email),
        escapeCsvValue(hospital.location),
        escapeCsvValue(hospital.status),
        escapeCsvValue(
          hospital.created_at ? new Date(hospital.created_at).toLocaleString('th-TH') : '-'
        ),
      ]);

      const csvContent = [headers.map(escapeCsvValue).join(','), ...rows.map((row) => row.join(','))].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `hospital-management-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('ส่งออกข้อมูลโรงพยาบาลสำเร็จ');
    } catch (error) {
      console.error('Error exporting hospitals:', error);
      toast.error('ไม่สามารถส่งออกข้อมูลได้');
    } finally {
      setIsExporting(false);
    }
  }, [filteredHospitals]);

  return {
    // State
    hospitals,
    filteredHospitals,
    selectedHospital,
    searchQuery,
    selectedTab,
    isLoading,
    isProcessing,
    isExporting,
    isSearching: isDebouncing,

    // Setters
    setSelectedHospital,
    setSearchQuery,
    setSelectedTab,

    // Actions
    loadHospitals,
    handleApprove,
    handleReject,
    handleEdit,
    handleDelete,
    exportHospitals,
  };
}
