"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import RoleGuard from '@/components/auth/RoleGuard';
import DashboardLayout, { MenuItem } from '@/components/layout/DashboardLayout';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import {
  Card,
  CardBody,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
} from '@heroui/react';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  HomeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import type { Gym } from '@/types/database.types';

// Utility Components

const ApplicationTable = ({
  applications,
  onViewDetail,
  searchQuery,
  setSearchQuery,
  isLoading,
}: {
  applications: Gym[];
  onViewDetail: (app: Gym) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
}) => (
  <Card className="bg-default-100/50 backdrop-blur-sm border-none">
    <CardBody>
      <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="font-bold text-white text-xl">
          รายการรออนุมัติ ({applications.length})
        </h2>
        <Input
          placeholder="ค้นหาใบสมัคร..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
          className="max-w-xs"
        />
      </div>
      <Table aria-label="Pending Applications Table">
        <TableHeader>
          <TableColumn>ชื่อยิม</TableColumn>
          <TableColumn>ผู้ติดต่อ</TableColumn>
          <TableColumn>อีเมล</TableColumn>
          <TableColumn>วันที่สมัคร</TableColumn>
          <TableColumn>การกระทำ</TableColumn>
        </TableHeader>
        <TableBody emptyContent={isLoading ? null : "ไม่พบใบสมัครที่รอการอนุมัติ"}>
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell className="font-semibold text-white">{app.gym_name}</TableCell>
              <TableCell>{app.contact_name}</TableCell>
              <TableCell>{app.email}</TableCell>
              <TableCell>{formatDate(app.created_at)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={() => onViewDetail(app)}
                  >
                    <EyeIcon className="w-4 h-4" />
                    ดูรายละเอียด
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardBody>
  </Card>
);

const ApplicationDetailModal = ({
  isOpen,
  onClose,
  application,
  onApprove,
  onReject,
  isProcessing,
}: {
  isOpen: boolean;
  onClose: () => void;
  application: Gym | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isProcessing: boolean;
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    size="3xl"
    scrollBehavior="inside"
    backdrop="blur"
    classNames={{
      backdrop: "bg-black/50 backdrop-blur-sm",
      wrapper: "z-[100]",
    }}
  >
    <ModalContent className="bg-zinc-900 border border-zinc-700">
      {(closeModal) => (
        <>
          <ModalHeader>
            <h3>{application?.gym_name}</h3>
          </ModalHeader>
          <ModalBody>
            {application && (
              <div className="space-y-6">
                {application.images?.length > 0 && (
                  <div>
                    <p className="mb-3 text-default-400 text-sm">รูปภาพยิม</p>
                    <div className="gap-3 grid grid-cols-2 md:grid-cols-3">
                      {application.images.map((image, index) => (
                        <div key={index} className="relative rounded-lg w-full h-40 overflow-hidden">
                          <Image
                            src={image}
                            alt={`${application.gym_name} ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="mb-3 font-semibold text-white">ข้อมูลติดต่อ</h4>
                  <div className="space-y-3">
                    <p><strong>ผู้ติดต่อ:</strong> {application.contact_name}</p>
                    <p><strong>เบอร์โทรศัพท์:</strong> {application.phone}</p>
                    <p><strong>อีเมล:</strong> {application.email}</p>
                    <p><strong>ที่อยู่:</strong> {application.location}</p>
                  </div>
                </div>
                {application.services?.length > 0 && (
                  <div>
                    <h4 className="mb-3 font-semibold text-white">บริการที่มี</h4>
                    <div className="flex flex-wrap gap-2">
                      {application.services.map((service, index) => (
                        <Chip key={index} color="primary" variant="flat">
                          {service}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
                {application.gym_details && (
                  <div>
                    <h4 className="mb-3 font-semibold text-white">รายละเอียดเพิ่มเติม</h4>
                    <p>{application.gym_details}</p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {application && (
              <>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => onReject(application.id)}
                  isDisabled={isProcessing}
                >
                  <XCircleIcon className="w-4 h-4" />
                  ปฏิเสธ
                </Button>
                <Button
                  color="success"
                  onPress={() => onApprove(application.id)}
                  isLoading={isProcessing}
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  อนุมัติ
                </Button>
              </>
            )}
            <Button color="default" variant="light" onPress={closeModal}>
              ปิด
            </Button>
          </ModalFooter>
        </>
      )}
    </ModalContent>
  </Modal>
);

// Helper Functions

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'จัดการผู้ใช้', href: '/admin/dashboard/users', icon: UsersIcon },
  { label: 'จัดการยิม', href: '/admin/dashboard/gyms', icon: BuildingStorefrontIcon },
  { label: 'อนุมัติยิม', href: '/admin/dashboard/approvals', icon: ClockIcon },
  { label: 'รายงาน', href: '/admin/dashboard/reports', icon: DocumentTextIcon },
  { label: 'สถิติ', href: '/admin/dashboard/analytics', icon: ChartBarIcon },
  { label: 'ตั้งค่าระบบ', href: '/admin/dashboard/settings', icon: Cog6ToothIcon },
];

// Main Content

function AdminApprovalsContent() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Gym[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Gym | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const detailModal = useDisclosure();

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: apps, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(apps || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      showErrorToast('Failed to load pending applications.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filteredApplications = useMemo(() => {
    if (!searchQuery) return applications;
    const query = searchQuery.toLowerCase();
    return applications.filter(app =>
      app.gym_name.toLowerCase().includes(query) ||
      app.contact_name.toLowerCase().includes(query) ||
      app.email.toLowerCase().includes(query)
    );
  }, [applications, searchQuery]);

  const handleUpdateStatus = async (appId: string, status: 'approved' | 'rejected') => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/partner-applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.success) {
        await loadApplications();
        detailModal.onClose();
        showSuccessToast(`Application ${status} successfully.`);
      } else {
        showErrorToast('Error updating status: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showErrorToast('An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout
      menuItems={MENU_ITEMS}
      headerTitle="อนุมัติยิม"
      headerSubtitle={`มี ${applications.length} รายการที่รอการอนุมัติ`}
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
      userEmail={user?.email}
    >
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <section>
            <ApplicationTable
              applications={filteredApplications}
              onViewDetail={(app: Gym) => {
                setSelectedApplication(app);
                detailModal.onOpen();
              }}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isLoading={isLoading}
            />
          </section>
          <ApplicationDetailModal
            isOpen={detailModal.isOpen}
            onClose={detailModal.onClose}
            application={selectedApplication}
            isProcessing={isProcessing}
            onApprove={(id: string) => handleUpdateStatus(id, 'approved')}
            onReject={(id: string) => handleUpdateStatus(id, 'rejected')}
          />
        </>
      )}
    </DashboardLayout>
  );
}

export default function AdminApprovalsPage() {
  return (
    <RoleGuard allowedRole="admin">
      <Toaster />
      <AdminApprovalsContent />
    </RoleGuard>
  );
}
