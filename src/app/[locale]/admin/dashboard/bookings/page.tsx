"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { createClient } from '@/lib/database/supabase/client';
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
import type { Booking } from '@/types/database.types';
import { showErrorToast, showSuccessToast } from '@/lib/utils';

type BulkBookingAction = 'confirm' | 'complete' | 'cancel';

type BookingRow = Pick<Booking, 'id' | 'created_at' | 'updated_at'> &
  Partial<
    Pick<
      Booking,
      | 'booking_number'
      | 'customer_name'
      | 'customer_email'
      | 'status'
      | 'payment_status'
      | 'price_paid'
    >
  > & {
    gyms?: {
      id: string;
      gym_name: string;
    } | null;
  };

type SupabaseBookingRow = BookingRow & {
  gyms: { id: string; gym_name: string }[] | { id: string; gym_name: string } | null;
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
  const [bookings, setBookings] = useState<BookingRow[]>([]);
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
        .from('bookings')
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
            gyms:gym_id (
              id,
              gym_name
            )
          `,
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      const supabaseData = (data ?? []) as SupabaseBookingRow[];
      const normalized: BookingRow[] = supabaseData.map((booking) => ({
        id: booking.id,
        booking_number: booking.booking_number ?? undefined,
        customer_name: booking.customer_name ?? undefined,
        customer_email: booking.customer_email ?? undefined,
        status: booking.status ?? undefined,
        payment_status: booking.payment_status ?? undefined,
        price_paid:
          typeof booking.price_paid === 'number' ? booking.price_paid : undefined,
        created_at: booking.created_at,
        updated_at: booking.updated_at ?? booking.created_at,
        gyms: Array.isArray(booking.gyms)
          ? booking.gyms[0] ?? null
          : booking.gyms ?? null,
      }));

      setBookings(normalized);
    } catch (error) {
      console.error('Error loading bookings:', error);
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
    return bookings.filter((booking) => {
      const statusMatches =
        selectedTab === 'all' || booking.status?.toLowerCase() === selectedTab.toLowerCase();
      const searchMatches =
        !query ||
        booking.booking_number?.toLowerCase().includes(query) ||
        booking.customer_name?.toLowerCase().includes(query) ||
        booking.customer_email?.toLowerCase().includes(query) ||
        booking.gyms?.gym_name?.toLowerCase().includes(query);

      return statusMatches && searchMatches;
    });
  }, [bookings, searchQuery, selectedTab]);

  const isAllSelected =
    filteredBookings.length > 0 && selectedIds.size === filteredBookings.length;
  const isIndeterminate =
    selectedIds.size > 0 && selectedIds.size < filteredBookings.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBookings.map((booking) => booking.id)));
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
      const response = await fetch('/api/admin/bookings/bulk-update', {
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
      console.error('Bulk booking action error:', error);
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
    { key: 'all', label: 'ทั้งหมด', count: bookings.length },
    { key: 'pending', label: 'รอตรวจสอบ', count: bookings.filter((b) => b.status === 'pending').length },
    { key: 'confirmed', label: 'ยืนยันแล้ว', count: bookings.filter((b) => b.status === 'confirmed').length },
    { key: 'completed', label: 'เสร็จสิ้น', count: bookings.filter((b) => b.status === 'completed').length },
    { key: 'cancelled', label: 'ยกเลิก', count: bookings.filter((b) => b.status === 'cancelled').length },
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
              <p className="font-bold text-2xl">{bookings.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-default-400 text-sm">รอตรวจสอบ</p>
              <p className="font-bold text-2xl text-yellow-400">
                {bookings.filter((b) => b.status === 'pending').length}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-default-400 text-sm">ยืนยันแล้ว</p>
              <p className="font-bold text-2xl text-green-400">
                {bookings.filter((b) => b.status === 'confirmed').length}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-default-400 text-sm">ยกเลิก</p>
              <p className="font-bold text-2xl text-red-400">
                {bookings.filter((b) => b.status === 'cancelled').length}
              </p>
            </CardBody>
          </Card>
        </div>

        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <Input
                placeholder="ค้นหาเลขที่การจอง ลูกค้า หรือชื่อยิม..."
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

        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
          className="mb-4"
        >
          {tabs.map((tab) => (
            <Tab key={tab.key} title={`${tab.label} (${tab.count})`} />
          ))}
        </Tabs>

        <Card>
          <CardBody>
            <Table
              aria-label="Bookings management table"
              classNames={{
                wrapper: 'bg-transparent border border-default-200 rounded-lg overflow-hidden',
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
                    aria-label="Select all bookings"
                  />
                </TableColumn>
                <TableColumn>เลขที่การจอง</TableColumn>
                <TableColumn>ลูกค้า</TableColumn>
                <TableColumn>ยิม</TableColumn>
                <TableColumn>สถานะการจอง</TableColumn>
                <TableColumn>สถานะการชำระ</TableColumn>
                <TableColumn>ยอดชำระ (บาท)</TableColumn>
                <TableColumn>อัปเดตล่าสุด</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบรายการจอง">
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <Checkbox
                        isSelected={selectedIds.has(booking.id)}
                        onValueChange={() => toggleSelect(booking.id)}
                        aria-label={`เลือกการจอง ${booking.booking_number}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{booking.booking_number}</span>
                        <span className="text-xs text-default-400">
                          สร้างเมื่อ {formatDate(booking.created_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{booking.customer_name}</span>
                        <span className="text-xs text-default-400">
                          {booking.customer_email || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.gyms?.gym_name ? (
                        <span className="font-medium text-default-200">{booking.gyms.gym_name}</span>
                      ) : (
                        <span className="text-default-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getStatusColor(booking.status)}
                        variant="flat"
                      >
                        {STATUS_LABELS[booking.status ?? ''] ?? booking.status ?? '-'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getPaymentStatusColor(booking.payment_status)}
                        variant="flat"
                      >
                        {PAYMENT_STATUS_LABELS[booking.payment_status ?? ''] ??
                          booking.payment_status ??
                          '-'}
                      </Chip>
                    </TableCell>
                    <TableCell>{Number(booking.price_paid ?? 0).toLocaleString('th-TH')}</TableCell>
                    <TableCell>{formatDate(booking.updated_at)}</TableCell>
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


