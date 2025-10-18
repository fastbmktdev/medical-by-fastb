"use client";

import { useEffect, useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import RoleGuard from '@/components/auth/RoleGuard';
import DashboardLayout, { MenuItem } from '@/components/layout/DashboardLayout';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Input,
  Tabs,
  Tab,
  useDisclosure,
} from '@heroui/react';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import type { Gym } from '@/types/database.types';
import GymStatsCards from './components/GymStatsCards';
import GymDetailModal from './components/GymDetailModal';
import GymEditModal from './components/GymEditModal';
import GymDeleteDialog from './components/GymDeleteDialog';

function AdminGymsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [filteredGyms, setFilteredGyms] = useState<Gym[]>([]);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal states
  const detailModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteDialog = useDisclosure();

  // Load gyms from API
  const loadGyms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gyms');
      const data = await response.json();

      if (data.success && data.gyms) {
        setGyms(data.gyms);
      } else {
        showErrorToast(data.error || 'Failed to load gyms');
      }
    } catch (error) {
      console.error('Error loading gyms:', error);
      showErrorToast('An unexpected error occurred while loading gyms.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
    loadGyms();
  }, [loadGyms, supabase.auth]);

  // Filter gyms by status and search query
  useEffect(() => {
    let filtered = gyms;

    // Filter by status tab
    if (selectedTab !== 'all') {
      filtered = filtered.filter(gym => gym.status === selectedTab);
    }

    // Filter by search query (with debounce effect)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(gym =>
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
        detailModal.onClose();
        showSuccessToast('อนุมัติยิมสำเร็จ');
      } else {
        showErrorToast('เกิดข้อผิดพลาด: ' + result.error);
      }
    } catch (error) {
      console.error('Error approving gym:', error);
      showErrorToast('เกิดข้อผิดพลาดในการอนุมัติยิม');
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
        detailModal.onClose();
        showSuccessToast('ปฏิเสธยิมสำเร็จ');
      } else {
        showErrorToast('เกิดข้อผิดพลาด: ' + result.error);
      }
    } catch (error) {
      console.error('Error rejecting gym:', error);
      showErrorToast('เกิดข้อผิดพลาดในการปฏิเสธยิม');
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
        editModal.onClose();
        showSuccessToast('แก้ไขข้อมูลยิมสำเร็จ');
      } else {
        showErrorToast('เกิดข้อผิดพลาด: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error editing gym:', error);
      showErrorToast('เกิดข้อผิดพลาดในการแก้ไขข้อมูลยิม');
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
        deleteDialog.onClose();
        showSuccessToast('ลบยิมสำเร็จ');
      } else {
        showErrorToast('เกิดข้อผิดพลาด: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting gym:', error);
      showErrorToast('เกิดข้อผิดพลาดในการลบยิม');
    } finally {
      setIsProcessing(false);
    }
  };

  const menuItems: MenuItem[] = [
    { label: 'จัดการผู้ใช้', href: '/admin/dashboard/users', icon: UsersIcon },
    { label: 'จัดการยิม', href: '/admin/dashboard/gyms', icon: BuildingStorefrontIcon },
    { label: 'อนุมัติยิม', href: '/admin/dashboard/approvals', icon: ClockIcon },
    { label: 'รายงาน', href: '/admin/dashboard/reports', icon: DocumentTextIcon },
    { label: 'สถิติ', href: '/admin/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่าระบบ', href: '/admin/dashboard/settings', icon: Cog6ToothIcon },
  ];

  const getStatusChip = (status?: string) => {
    const statusConfig = {
      pending: { label: 'รอการตรวจสอบ', color: 'warning' as const },
      approved: { label: 'อนุมัติแล้ว', color: 'success' as const },
      rejected: { label: 'ไม่อนุมัติ', color: 'danger' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Chip color={config.color} variant="flat" size="sm">
        {config.label}
      </Chip>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="จัดการยิม"
        headerSubtitle="ดูและจัดการยิมทั้งหมดในระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <div className="border-4 border-t-transparent border-red-600 rounded-full w-12 h-12 animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle="จัดการยิม"
      headerSubtitle="ดูและจัดการยิมทั้งหมดในระบบ"
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
      userEmail={user?.email}
    >
      {/* Stats */}
      <section className="mb-8">
        <GymStatsCards gyms={gyms} />
      </section>

      {/* Gyms Table */}
      <section>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="font-bold text-white text-xl">
                รายชื่อยิม ({filteredGyms.length})
              </h2>
              <Input
                placeholder="ค้นหายิม..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                className="max-w-xs"
                classNames={{
                  input: "text-white",
                }}
              />
            </div>

            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              className="mb-6"
              color="danger"
            >
              <Tab key="all" title="ทั้งหมด" />
              <Tab key="approved" title="อนุมัติแล้ว" />
              <Tab key="pending" title="รออนุมัติ" />
              <Tab key="rejected" title="ไม่อนุมัติ" />
            </Tabs>

            <Table
              aria-label="Gyms table"
              classNames={{
                wrapper: "bg-transparent",
              }}
            >
              <TableHeader>
                <TableColumn>ชื่อยิม</TableColumn>
                <TableColumn>ผู้ติดต่อ</TableColumn>
                <TableColumn>โทรศัพท์</TableColumn>
                <TableColumn>สถานที่</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>วันที่สร้าง</TableColumn>
                <TableColumn>การกระทำ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบข้อมูลยิม">
                {filteredGyms.map((gym) => (
                  <TableRow key={gym.id}>
                    <TableCell className="font-semibold text-white">{gym.gym_name}</TableCell>
                    <TableCell className="text-default-400">{gym.contact_name}</TableCell>
                    <TableCell className="font-mono text-default-400 text-sm">{gym.phone}</TableCell>
                    <TableCell className="text-default-400">{gym.location}</TableCell>
                    <TableCell>{getStatusChip(gym.status)}</TableCell>
                    <TableCell className="text-default-400">
                      {gym.created_at ? new Date(gym.created_at).toLocaleDateString('th-TH') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          color="primary"
                          onPress={() => {
                            setSelectedGym(gym);
                            detailModal.onOpen();
                          }}
                          title="ดูรายละเอียด"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          color="secondary"
                          onPress={() => {
                            setSelectedGym(gym);
                            editModal.onOpen();
                          }}
                          title="แก้ไข"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          color="danger"
                          onPress={() => {
                            setSelectedGym(gym);
                            deleteDialog.onOpen();
                          }}
                          title="ลบ"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </section>

      {/* Modals */}
      <GymDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.onClose}
        gym={selectedGym}
        onApprove={handleApprove}
        onReject={handleReject}
        onEdit={(gym) => {
          setSelectedGym(gym);
          editModal.onOpen();
        }}
        onDelete={(gym) => {
          setSelectedGym(gym);
          deleteDialog.onOpen();
        }}
        isProcessing={isProcessing}
      />

      <GymEditModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        gym={selectedGym}
        onSave={handleEdit}
        isProcessing={isProcessing}
      />

      <GymDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        gym={selectedGym}
        onConfirm={handleDelete}
        isProcessing={isProcessing}
      />
    </DashboardLayout>
  );
}

export default function AdminGymsPage() {
  return (
    <RoleGuard allowedRole="admin">
      <Toaster />
      <AdminGymsContent />
    </RoleGuard>
  );
}
