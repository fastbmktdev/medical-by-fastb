"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { createClient } from '@shared/lib/database/supabase/client';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import {
  Card,
  CardBody,
  Button,
  Chip,
  Input,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Tab,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@heroui/react';
import { LoadingSpinner } from '@/components/design-system/primitives/Loading';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import type { User } from '@supabase/supabase-js';
import type { appointment } from '@shared/types/database.types';
import { showErrorToast, showSuccessToast } from '@shared/lib/utils';
import { SimpleExportButtons } from '@/components/shared/TableExportButton';

type BulkBookingAction = 'confirm' | 'complete' | 'cancel';

type BookingRow = Pick<appointment, 'id' | 'created_at' | 'updated_at'> &
  Partial<
    Pick<
      appointment,
      | 'booking_number'
      | 'customer_name'
      | 'customer_email'
      | 'status'
      | 'payment_status'
      | 'price_paid'
    >
  > & {
    hospitals?: {
      id: string;
      hospital_name: string;
    } | null;
  };

type SupabaseBookingRow = BookingRow & {
  hospitals: { id: string; hospital_name: string }[] | { id: string; hospital_name: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'รอตรวจสอบ',
  confirmed: 'ยืนยันแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'รอชำระ',
  paid: 'ชำระแล้ว',
  failed: 'ชำระล้มเหลว',
  refunded: 'คืนเงินแล้ว',
};

const ACTION_LABELS: Record<BulkBookingAction, string> = {
  confirm: 'ยืนยัน',
  complete: 'เสร็จสิ้น',
  cancel: 'ยกเลิก',
};

function getStatusColor(status?: string | null): 'success' | 'warning' | 'danger' | 'default' {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'danger';
    default:
      return 'default';
  }
}

function getPaymentStatusColor(status?: string | null): 'success' | 'warning' | 'danger' | 'default' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'refunded':
      return 'default';
    case 'failed':
      return 'danger';
    default:
      return 'default';
  }
}

function formatDate(dateString?: string | null) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AdminBookingsContent() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setBookings] = useState<BookingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkBookingAction | null>(null);

  const confirmModal = useDisclosure();

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      const { data, error } = await supabase
        .from('appointments')
        .select(
          `
            id,
            booking_number,
            customer_name,
            customer_email,
            status,
            payment_status,
            price_paid,
            created_at,
            updated_at,
            hospitals:hospital_id (
              id,
              hospital_name
            )
          `,
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      const supabaseData = (data ?? []) as SupabaseBookingRow[];
      const normalized: BookingRow[] = supabaseData.map((appointment) => ({
        id: appointment.id,
        booking_number: appointment.booking_number ?? undefined,
        customer_name: appointment.customer_name ?? undefined,
        customer_email: appointment.customer_email ?? undefined,
        status: appointment.status ?? undefined,
        payment_status: appointment.payment_status ?? undefined,
        price_paid:
          typeof appointment.price_paid === 'number' ? appointment.price_paid : undefined,
        created_at: appointment.created_at,
        updated_at: appointment.updated_at ?? appointment.created_at,
        hospitals: Array.isArray(appointment.hospitals)
          ? appointment.hospitals[0] ?? null
          : appointment.hospitals ?? null,
      }));

      setBookings(normalized);
    } catch (error) {
      console.error('Error loading appointments:', error);
      showErrorToast('โหลดรายการจองไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const statusMatches =
        selectedTab === 'all' || appointment.status?.toLowerCase() === selectedTab.toLowerCase();
      const searchMatches =
        !query ||
        appointment.booking_number?.toLowerCase().includes(query) ||
        appointment.customer_name?.toLowerCase().includes(query) ||
        appointment.customer_email?.toLowerCase().includes(query) ||
        appointment.hospitals?.hospital_name?.toLowerCase().includes(query);

      return statusMatches && searchMatches;
    });
  }, [appointments, searchQuery, selectedTab]);

  const isAllSelected =
    filteredBookings.length > 0 && selectedIds.size === filteredBookings.length;
  const isIndeterminate =
    selectedIds.size > 0 && selectedIds.size < filteredBookings.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBookings.map((appointment) => appointment.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const performBulkAction = async (action: BulkBookingAction, ids: string[]) => {
    if (ids.length === 0) {
      showErrorToast('กรุณาเลือกรายการก่อน');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/appointments/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          bookingIds: ids,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showSuccessToast(
          `${ACTION_LABELS[action]}การจอง ${result.data.affectedCount} รายการสำเร็จ`,
        );
        setSelectedIds(new Set());
        await loadBookings();
      } else {
        showErrorToast(result.error || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      }
    } catch (error) {
      console.error('Bulk appointment action error:', error);
      showErrorToast('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setIsProcessing(false);
      confirmModal.onClose();
      setPendingAction(null);
    }
  };

  const handleBulkActionClick = (action: BulkBookingAction) => {
    if (selectedIds.size === 0) {
      showErrorToast('กรุณาเลือกรายการที่ต้องการดำเนินการ');
      return;
    }
    setPendingAction(action);
    confirmModal.onOpen();
  };

  const tabs: { key: string; label: string; count: number }[] = [
    { key: 'all', label: 'ทั้งหมด', count: appointments.length },
    { key: 'pending', label: 'รอตรวจสอบ', count: appointments.filter((b) => b.status === 'pending').length },
    { key: 'confirmed', label: 'ยืนยันแล้ว', count: appointments.filter((b) => b.status === 'confirmed').length },
    { key: 'completed', label: 'เสร็จสิ้น', count: appointments.filter((b) => b.status === 'completed').length },
    { key: 'cancelled', label: 'ยกเลิก', count: appointments.filter((b) => b.status === 'cancelled').length },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการการจอง"
        headerSubtitle="จัดการสถานะการจองทั้งหมดในระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner size="xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการการจอง"
        headerSubtitle="อัปเดตสถานะการจองแบบกลุ่ม"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <Toaster position="top-right" />

        <div className="gap-4 grid grid-cols-1 md:grid-cols-4 mb-6">
          <Card>
            <CardBody>
              <p className="text-default-400 text-sm">ทั้งหมด</p>
              <p className="font-semibold text-2xl">{appointments.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-default-400 text-sm">รอตรวจสอบ</p>
              <p className="font-semibold text-2xl text-yellow-400">
                {appointments.filter((b) => b.status === 'pending').length}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-default-400 text-sm">ยืนยันแล้ว</p>
              <p className="font-semibold text-2xl text-green-400">
                {appointments.filter((b) => b.status === 'confirmed').length}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-default-400 text-sm">ยกเลิก</p>
              <p className="font-semibold text-2xl text-red-400">
                {appointments.filter((b) => b.status === 'cancelled').length}
              </p>
            </CardBody>
          </Card>
        </div>

        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <Input
                placeholder="ค้นหาเลขที่การจอง ลูกค้า หรือชื่อโรงพยาบาล..."
                startContent={<MagnifyingGlassIcon className="w-5 h-5 text-default-400" />}
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="max-w-xl"
              />
              <div className="flex gap-2">
                <Button
                  color="success"
                  variant="flat"
                  startContent={<CheckCircleIcon className="w-4 h-4" />}
                  onPress={() => handleBulkActionClick('confirm')}
                  isDisabled={selectedIds.size === 0 || isProcessing}
                >
                  ยืนยัน
                </Button>
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<ClipboardDocumentCheckIcon className="w-4 h-4" />}
                  onPress={() => handleBulkActionClick('complete')}
                  isDisabled={selectedIds.size === 0 || isProcessing}
                >
                  เสร็จสิ้น
                </Button>
                <Button
                  color="danger"
                  variant="flat"
                  startContent={<XCircleIcon className="w-4 h-4" />}
                  onPress={() => handleBulkActionClick('cancel')}
                  isDisabled={selectedIds.size === 0 || isProcessing}
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-between items-center mb-4 gap-4">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            className="flex-1"
          >
            {tabs.map((tab) => (
              <Tab key={tab.key} title={`${tab.label} (${tab.count})`} />
            ))}
          </Tabs>

          {/* Export Buttons */}
          <SimpleExportButtons
            exportOptions={{
              data: filteredBookings,
              columns: [
                { key: 'booking_number', label: 'เลขที่การจอง' },
                { key: 'customer_name', label: 'ลูกค้า' },
                { key: 'customer_email', label: 'อีเมล' },
                { 
                  key: 'hospital_name', 
                  label: 'โรงพยาบาล',
                  format: (_, row: BookingRow) => String(row.hospitals?.hospital_name || '-')
                },
                { 
                  key: 'status', 
                  label: 'สถานะการจอง',
                  format: (_, row: BookingRow) => String(row.status || '-')
                },
                { 
                  key: 'payment_status', 
                  label: 'สถานะการชำระ',
                  format: (_, row: BookingRow) => String(row.payment_status || '-')
                },
                { 
                  key: 'price_paid', 
                  label: 'ยอดชำระ (บาท)',
                  format: (_, row: BookingRow) => row.price_paid ? Number(row.price_paid).toLocaleString() : '0'
                },
                { 
                  key: 'updated_at', 
                  label: 'อัปเดตล่าสุด',
                  format: (_, row: BookingRow) => formatDate(row.updated_at)
                },
              ],
              filename: `admin-appointments-${selectedTab}`,
              title: 'รายงานการจอง - Admin Dashboard',
              subtitle: `สถานะ: ${tabs.find(t => t.key === selectedTab)?.label || selectedTab} (${filteredBookings.length} รายการ)`,
              options: {
                orientation: 'landscape',
                includeTimestamp: true,
              },
            }}
            size="sm"
          />
        </div>

        <Card>
          <CardBody>
            <Table
              aria-label="appointments management table"
              classNames={{
                wrapper: 'bg-transparent border border-default-200  overflow-hidden',
                th: 'bg-default-100/80 text-default-700 font-semibold text-sm border-b border-default-200 py-4',
                td: 'border-b border-default-200/50 py-4',
              }}
              removeWrapper={false}
            >
              <TableHeader>
                <TableColumn width={45}>
                  <Checkbox
                    isSelected={isAllSelected}
                    isIndeterminate={isIndeterminate}
                    onValueChange={toggleSelectAll}
                    aria-label="Select all appointments"
                  />
                </TableColumn>
                <TableColumn>เลขที่การจอง</TableColumn>
                <TableColumn>ลูกค้า</TableColumn>
                <TableColumn>โรงพยาบาล</TableColumn>
                <TableColumn>สถานะการจอง</TableColumn>
                <TableColumn>สถานะการชำระ</TableColumn>
                <TableColumn>ยอดชำระ (บาท)</TableColumn>
                <TableColumn>อัปเดตล่าสุด</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบรายการจอง">
                {filteredBookings.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <Checkbox
                        isSelected={selectedIds.has(appointment.id)}
                        onValueChange={() => toggleSelect(appointment.id)}
                        aria-label={`เลือกการจอง ${appointment.booking_number}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-950">{appointment.booking_number}</span>
                        <span className="text-xs text-default-400">
                          สร้างเมื่อ {formatDate(appointment.created_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-950">{appointment.customer_name}</span>
                        <span className="text-xs text-default-400">
                          {appointment.customer_email || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {appointment.hospitals?.hospital_name ? (
                        <span className="font-medium text-default-200">{appointment.hospitals.hospital_name}</span>
                      ) : (
                        <span className="text-default-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getStatusColor(appointment.status)}
                        variant="flat"
                      >
                        {STATUS_LABELS[appointment.status ?? ''] ?? appointment.status ?? '-'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getPaymentStatusColor(appointment.payment_status)}
                        variant="flat"
                      >
                        {PAYMENT_STATUS_LABELS[appointment.payment_status ?? ''] ??
                          appointment.payment_status ??
                          '-'}
                      </Chip>
                    </TableCell>
                    <TableCell>{Number(appointment.price_paid ?? 0).toLocaleString('th-TH')}</TableCell>
                    <TableCell>{formatDate(appointment.updated_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </DashboardLayout>

      <Modal
        backdrop="blur"
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.onClose}
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader>ยืนยันการดำเนินการ</ModalHeader>
              <ModalBody>
                <p>
                  คุณต้องการ{pendingAction ? ACTION_LABELS[pendingAction] : ''}การจอง{' '}
                  {selectedIds.size} รายการหรือไม่?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={closeModal} isDisabled={isProcessing}>
                  ยกเลิก
                </Button>
                <Button
                  color={pendingAction === 'cancel' ? 'danger' : 'primary'}
                  onPress={() =>
                    pendingAction && performBulkAction(pendingAction, Array.from(selectedIds))
                  }
                  isLoading={isProcessing}
                >
                  ยืนยัน
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export default function AdminBookingsPage() {
  return <AdminBookingsContent />;
}


