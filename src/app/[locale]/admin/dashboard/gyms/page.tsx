"use client";

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, ResponsiveTable, Pagination, usePagination } from '@/components/shared';
import type { ResponsiveTableColumn } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import { Card, CardBody, Chip, Button, Input, Tabs, Tab, useDisclosure, Spinner } from '@heroui/react';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import type { Gym } from '@/types';
import {
  GymStatsCards,
  GymDetailModal,
  GymEditModal,
  GymDeleteDialog,
  useGymManagement,
  STATUS_CONFIG,
} from '@/components/features/admin/gym-management';

function AdminGymsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  // Use custom hook for gym management
  const {
    gyms,
    filteredGyms,
    selectedGym,
    searchQuery,
    selectedTab,
    isLoading,
    isProcessing,
    isExporting,
    isSearching,
    exportGyms,
    setSelectedGym,
    setSearchQuery,
    setSelectedTab,
    loadGyms,
    handleApprove,
    handleReject,
    handleEdit,
    handleDelete,
  } = useGymManagement();

  // Modal states
  const detailModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteDialog = useDisclosure();

  // Pagination
  const pagination = usePagination({
    totalItems: filteredGyms.length,
    initialPage: 1,
    initialItemsPerPage: 10,
  });

  // Get paginated gyms
  const paginatedGyms = filteredGyms.slice(pagination.startIndex, pagination.endIndex);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    loadUser();
    loadGyms();
  }, [supabase, loadGyms]);

  // Wrapper functions to handle modal closing
  const handleApproveWithClose = async (gymId: string) => {
    const success = await handleApprove(gymId);
    if (success) {
      detailModal.onClose();
    }
  };

  const handleRejectWithClose = async (gymId: string) => {
    const success = await handleReject(gymId);
    if (success) {
      detailModal.onClose();
    }
  };

  const handleEditWithClose = async (gymId: string, data: Partial<Gym>) => {
    const success = await handleEdit(gymId, data);
    if (success) {
      editModal.onClose();
    }
  };

  const handleDeleteWithClose = async (gymId: string) => {
    const success = await handleDelete(gymId);
    if (success) {
      deleteDialog.onClose();
    }
  };

  const getStatusChip = (status?: string) => {
    const config = STATUS_CONFIG[status || 'pending'];

    return (
      <Chip color={config.color} variant="flat" size="sm">
        {config.label}
      </Chip>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
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
      menuItems={adminMenuItems}
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
        <Card className="border border-default-200/60 bg-default-50/40 backdrop-blur-md shadow-sm">
          <CardBody>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="font-semibold text-xl text-default-900">
                  รายชื่อยิม ({filteredGyms.length})
                </h2>
                <p className="text-sm text-default-500">
                  ค้นหา ตรวจสอบสถานะ และจัดการรายละเอียดของค่ายมวยในระบบ
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <Input
                  placeholder="ค้นหายิม..."
                  value={searchQuery}
                  radius="lg"
                  size="sm"
                  variant="bordered"
                  onValueChange={setSearchQuery}
                  startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                  endContent={isSearching && <Spinner size="sm" color="default" />}
                  className="w-full sm:w-64"
                />
                <Button
                  color="success"
                  variant="flat"
                  size="sm"
                  startContent={!isExporting && <ArrowDownTrayIcon className="w-4 h-4" />}
                  onPress={exportGyms}
                  isLoading={isExporting}
                  className="w-full sm:w-auto"
                >
                  Export ข้อมูล
                </Button>
              </div>
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

            <ResponsiveTable
              data={paginatedGyms}
              exportConfig={{
                enabled: true,
                filename: `admin-gyms-${selectedTab}`,
                title: 'รายงานยิม - Admin Dashboard',
                subtitle: `สถานะ: ${selectedTab === 'all' ? 'ทั้งหมด' : selectedTab} (${filteredGyms.length} รายการ)`,
                options: {
                  orientation: 'landscape',
                  includeTimestamp: true,
                },
              }}
              columns={[
                {
                  key: 'gym_name',
                  label: 'ชื่อยิม',
                  render: (gym) => (
                    <span className="font-semibold text-white">{gym.gym_name}</span>
                  ),
                  showOnMobile: true,
                  exportFormat: (gym) => gym.gym_name,
                },
                {
                  key: 'contact_name',
                  label: 'ผู้ติดต่อ',
                  render: (gym) => (
                    <span className="text-default-400">{gym.contact_name}</span>
                  ),
                  showOnMobile: true,
                  exportFormat: (gym) => gym.contact_name,
                },
                {
                  key: 'phone',
                  label: 'โทรศัพท์',
                  render: (gym) => (
                    <span className="font-mono text-default-400 text-sm">{gym.phone}</span>
                  ),
                  showOnMobile: false,
                  exportFormat: (gym) => gym.phone,
                },
                {
                  key: 'location',
                  label: 'สถานที่',
                  render: (gym) => (
                    <span className="text-default-400">{gym.location}</span>
                  ),
                  showOnMobile: false,
                  exportFormat: (gym) => gym.location,
                },
                {
                  key: 'status',
                  label: 'สถานะ',
                  render: (gym) => getStatusChip(gym.status),
                  showOnMobile: true,
                  exportFormat: (gym) => gym.status,
                },
                {
                  key: 'created_at',
                  label: 'วันที่สร้าง',
                  render: (gym) => (
                    <span className="text-default-400">
                      {gym.created_at ? new Date(gym.created_at).toLocaleDateString('th-TH') : '-'}
                    </span>
                  ),
                  showOnMobile: false,
                  exportFormat: (gym) => gym.created_at ? new Date(gym.created_at).toLocaleDateString('th-TH') : '-',
                },
                {
                  key: 'actions',
                  label: 'การกระทำ',
                  render: (gym) => (
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
                        aria-label="ดูรายละเอียด"
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
                        aria-label="แก้ไข"
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
                        aria-label="ลบ"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ),
                  showOnMobile: true,
                  hideLabelOnMobile: true,
                },
              ] as ResponsiveTableColumn<Gym>[]}
              keyExtractor={(gym) => gym.id}
              emptyContent="ไม่พบข้อมูลยิม"
              ariaLabel="Gyms table"
              className="border border-default-200 rounded-lg overflow-hidden"
            />

            {/* Pagination */}
            {filteredGyms.length > 10 && (
              <div className="mt-6">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={filteredGyms.length}
                  itemsPerPage={pagination.itemsPerPage}
                  onPageChange={pagination.setCurrentPage}
                  showItemsPerPage
                  onItemsPerPageChange={pagination.setItemsPerPage}
                  itemsPerPageOptions={[10, 25, 50, 100]}
                />
              </div>
            )}
          </CardBody>
        </Card>
      </section>

      {/* Modals */}
      <GymDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.onClose}
        gym={selectedGym}
        onApprove={handleApproveWithClose}
        onReject={handleRejectWithClose}
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
        onSave={handleEditWithClose}
        isProcessing={isProcessing}
      />

      <GymDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        gym={selectedGym}
        onConfirm={handleDeleteWithClose}
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
