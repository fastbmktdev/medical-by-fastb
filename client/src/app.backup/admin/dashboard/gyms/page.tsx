"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { createClient } from "@shared/lib/database/supabase/client";
import { RoleGuard } from "@/components/features/auth";
import {
  DashboardLayout,
  ResponsiveTable,
  Pagination,
  usePagination,
} from "@/components/shared";
import type { ResponsiveTableColumn } from "@/components/shared";
import { adminMenuItems } from "@/components/features/admin/adminMenuItems";
import {
  Card,
  CardBody,
  Chip,
  Button,
  Input,
  Tabs,
  Tab,
  useDisclosure,
  Spinner,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { User } from "@supabase/supabase-js";
import type { hospital } from "@shared/types";
import {
  HospitalStatsCards,
  HospitalDetailModal,
  HospitalEditModal,
  HospitalDeleteDialog,
  useHospitalManagement,
  STATUS_CONFIG,
} from "@/components/features/admin/hospital-management";

function AdminHospitalsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  // Use custom hook for hospital management
  const {
    hospitals,
    filteredHospitals,
    selectedHospital,
    searchQuery,
    selectedTab,
    isLoading,
    isProcessing,
    isExporting,
    isSearching,
    exportHospitals,
    setSelectedHospital,
    setSearchQuery,
    setSelectedTab,
    loadHospitals,
    handleApprove,
    handleReject,
    handleEdit,
    handleDelete,
  } = useHospitalManagement();

  // Modal states
  const detailModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteDialog = useDisclosure();

  // Pagination
  const pagination = usePagination({
    totalItems: filteredHospitals.length,
    initialPage: 1,
    initialItemsPerPage: 10,
  });

  // Get paginated hospitals
  const paginatedHospitals = filteredHospitals.slice(
    pagination.startIndex,
    pagination.endIndex
  );

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    loadUser();
    loadHospitals();
  }, [supabase, loadHospitals]);

  // Wrapper functions to handle modal closing
  const handleApproveWithClose = async (hospitalId: string) => {
    const success = await handleApprove(hospitalId);
    if (success) {
      detailModal.onClose();
    }
  };

  const handleRejectWithClose = async (hospitalId: string) => {
    const success = await handleReject(hospitalId);
    if (success) {
      detailModal.onClose();
    }
  };

  const handleEditWithClose = async (
    hospitalId: string,
    data: Partial<hospital>
  ) => {
    const success = await handleEdit(hospitalId, data);
    if (success) {
      editModal.onClose();
    }
  };

  const handleDeleteWithClose = async (hospitalId: string) => {
    const success = await handleDelete(hospitalId);
    if (success) {
      deleteDialog.onClose();
    }
  };

  const getStatusChip = (status?: string) => {
    const config = STATUS_CONFIG[status || "pending"];

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
        headerTitle="จัดการโรงพยาบาล"
        headerSubtitle="ดูและจัดการโรงพยาบาลทั้งหมดในระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <div className="border-4 border-t-transparent border-red-600  w-12 h-12 animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={adminMenuItems}
      headerTitle="จัดการโรงพยาบาล"
      headerSubtitle="ดูและจัดการโรงพยาบาลทั้งหมดในระบบ"
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
      userEmail={user?.email}
    >
      {/* Stats */}
      <section className="mb-8">
        <HospitalStatsCards hospitals={hospitals} />
      </section>

      {/* hospitals Table */}
      <section>
        <Card className="border border-default-200/60 bg-default-50/40 backdrop-blur-md shadow-sm">
          <CardBody>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="font-semibold text-xl text-default-900">
                  รายชื่อโรงพยาบาล ({filteredHospitals.length})
                </h2>
                <p className="text-sm text-default-500">
                  ค้นหา ตรวจสอบสถานะ และจัดการรายละเอียดของโรงพยาบาลในระบบ
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <Input
                  placeholder="ค้นหาโรงพยาบาล..."
                  value={searchQuery}
                  radius="lg"
                  size="sm"
                  variant="bordered"
                  onValueChange={setSearchQuery}
                  startContent={
                    <MagnifyingGlassIcon className="w-4 h-4 text-default-400" />
                  }
                  endContent={
                    isSearching && <Spinner size="sm" color="default" />
                  }
                  className="w-full sm:w-64"
                />
                <Button
                  color="success"
                  variant="flat"
                  size="sm"
                  startContent={
                    !isExporting && <ArrowDownTrayIcon className="w-4 h-4" />
                  }
                  onPress={exportHospitals}
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
              data={paginatedHospitals}
              exportConfig={{
                enabled: true,
                filename: `admin-hospitals-${selectedTab}`,
                title: "รายงานโรงพยาบาล - Admin Dashboard",
                subtitle: `สถานะ: ${selectedTab === "all" ? "ทั้งหมด" : selectedTab} (${filteredHospitals.length} รายการ)`,
                options: {
                  orientation: "landscape",
                  includeTimestamp: true,
                },
              }}
              columns={
                [
                  {
                    key: "hospital_name",
                    label: "ชื่อโรงพยาบาล",
                    render: (hospital) => (
                      <span className="font-semibold text-white">
                        {hospital.hospital_name}
                      </span>
                    ),
                    showOnMobile: true,
                    exportFormat: (hospital) => hospital.hospital_name,
                  },
                  {
                    key: "contact_name",
                    label: "ผู้ติดต่อ",
                    render: (hospital) => (
                      <span className="text-default-400">
                        {hospital.contact_name}
                      </span>
                    ),
                    showOnMobile: true,
                    exportFormat: (hospital) => hospital.contact_name,
                  },
                  {
                    key: "phone",
                    label: "โทรศัพท์",
                    render: (hospital) => (
                      <span className="font-mono text-default-400 text-sm">
                        {hospital.phone}
                      </span>
                    ),
                    showOnMobile: false,
                    exportFormat: (hospital) => hospital.phone,
                  },
                  {
                    key: "location",
                    label: "สถานที่",
                    render: (hospital) => (
                      <span className="text-default-400">
                        {hospital.location}
                      </span>
                    ),
                    showOnMobile: false,
                    exportFormat: (hospital) => hospital.location,
                  },
                  {
                    key: "status",
                    label: "สถานะ",
                    render: (hospital) => getStatusChip(hospital.status),
                    showOnMobile: true,
                    exportFormat: (hospital) => hospital.status,
                  },
                  {
                    key: "created_at",
                    label: "วันที่สร้าง",
                    render: (hospital) => (
                      <span className="text-default-400">
                        {hospital.created_at
                          ? new Date(hospital.created_at).toLocaleDateString(
                              "th-TH"
                            )
                          : "-"}
                      </span>
                    ),
                    showOnMobile: false,
                    exportFormat: (hospital) =>
                      hospital.created_at
                        ? new Date(hospital.created_at).toLocaleDateString(
                            "th-TH"
                          )
                        : "-",
                  },
                  {
                    key: "actions",
                    label: "การกระทำ",
                    render: (hospital) => (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          color="primary"
                          onPress={() => {
                            setSelectedHospital(hospital);
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
                            setSelectedHospital(hospital);
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
                            setSelectedHospital(hospital);
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
                ] as ResponsiveTableColumn<hospital>[]
              }
              keyExtractor={(hospital) => hospital.id}
              emptyContent="ไม่พบข้อมูลโรงพยาบาล"
              ariaLabel="hospitals table"
              className="border border-default-200  overflow-hidden"
            />

            {/* Pagination */}
            {filteredHospitals.length > 10 && (
              <div className="mt-6">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={filteredHospitals.length}
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
      <HospitalDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.onClose}
        hospital={selectedHospital}
        onApprove={handleApproveWithClose}
        onReject={handleRejectWithClose}
        onEdit={(hospital) => {
          setSelectedHospital(hospital);
          editModal.onOpen();
        }}
        onDelete={(hospital) => {
          setSelectedHospital(hospital);
          deleteDialog.onOpen();
        }}
        isProcessing={isProcessing}
      />

      <HospitalEditModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        hospital={selectedHospital}
        onSave={handleEditWithClose}
        isProcessing={isProcessing}
      />

      <HospitalDeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={deleteDialog.onClose}
        hospital={selectedHospital}
        onConfirm={handleDeleteWithClose}
        isProcessing={isProcessing}
      />
    </DashboardLayout>
  );
}

export default function AdminHospitalsPage() {
  return (
    <RoleGuard allowedRole="admin">
      <Toaster />
      <AdminHospitalsContent />
    </RoleGuard>
  );
}
