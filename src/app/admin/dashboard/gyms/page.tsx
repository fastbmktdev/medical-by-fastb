"use client";

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
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
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
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
                  input: 'text-white',
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
                wrapper: 'bg-transparent',
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
