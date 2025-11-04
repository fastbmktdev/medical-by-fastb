"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import { showErrorToast } from '@/lib/utils';
import {
  Card,
  CardBody,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Button,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  CalendarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import type { Booking as BookingType, Gym } from '@/types';

function PartnerBookingsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<BookingType | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // ดึงข้อมูลค่ายมวยของ partner
        const { data: gymData } = await supabase
          .from('gyms')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        setGym(gymData);

        if (gymData) {
          // ดึงข้อมูลการจองทั้งหมดของค่ายนี้
          const { data: bookingsData, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('gym_id', gymData.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error loading bookings:', error);
          } else {
            setBookings(bookingsData || []);
          }
        }
      }

      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const menuItems: MenuItem[] = [
    { label: 'แดชบอร์ด', href: '/partner/dashboard', icon: ChartBarIcon },
    { label: 'ข้อมูลยิม', href: '/partner/dashboard/gym', icon: BuildingStorefrontIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/bookings', icon: CalendarIcon },
    { label: 'ปฏิทินการจอง', href: '/partner/dashboard/bookings/calendar', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'การจ่ายเงิน', href: '/partner/dashboard/payouts', icon: CurrencyDollarIcon },
    { label: 'สถิติ', href: '/partner/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่า', href: '/partner/dashboard/settings', icon: Cog6ToothIcon },
  ];

  const handleViewBooking = (booking: BookingType) => {
    setSelectedBooking(booking);
    onOpen();
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;

      // อัพเดทข้อมูลใน state
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));

      // ถ้ากำลังดูรายละเอียด ให้อัพเดทด้วย
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch (error) {
      showErrorToast('เกิดข้อผิดพลาดในการอัพเดทสถานะ');
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { label: string; color: 'success' | 'warning' | 'primary' | 'danger'; icon: React.ComponentType<{ className?: string }> }> = {
      confirmed: {
        label: 'ยืนยันแล้ว',
        color: 'success',
        icon: CheckCircleIcon,
      },
      pending: {
        label: 'รอยืนยัน',
        color: 'warning',
        icon: ClockIcon,
      },
      completed: {
        label: 'เสร็จสิ้น',
        color: 'primary',
        icon: CheckCircleIcon,
      },
      cancelled: {
        label: 'ยกเลิก',
        color: 'danger',
        icon: XCircleIcon,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Chip
        color={config.color}
        variant="flat"
        size="sm"
        startContent={<Icon className="w-3 h-3" />}
      >
        {config.label}
      </Chip>
    );
  };

  const getPaymentStatusChip = (status: string) => {
    const statusConfig: Record<string, { label: string; color: 'success' | 'warning' | 'danger' | 'default' }> = {
      paid: { label: 'ชำระแล้ว', color: 'success' },
      pending: { label: 'รอชำระ', color: 'warning' },
      failed: { label: 'ล้มเหลว', color: 'danger' },
      refunded: { label: 'คืนเงินแล้ว', color: 'default' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Chip color={config.color} variant="flat" size="sm">
        {config.label}
      </Chip>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    if (selectedTab === 'all') return true;
    return booking.status === selectedTab;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="ประวัติการจอง"
        headerSubtitle="จัดการการจองของลูกค้า"
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" color="secondary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!gym) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="ประวัติการจอง"
        headerSubtitle="จัดการการจองของลูกค้า"
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody className="py-12 text-center">
            <p className="text-default-500">ไม่พบข้อมูลค่ายมวย กรุณาสมัครเป็นพาร์ทเนอร์ก่อน</p>
          </CardBody>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle="ประวัติการจอง"
      headerSubtitle={`จัดการการจองของ ${gym.gym_name}`}
      roleLabel="พาร์ทเนอร์"
      roleColor="secondary"
      userEmail={user?.email}
    >
      {/* Stats Cards */}
      <section className="gap-4 grid grid-cols-1 md:grid-cols-5 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600">
          <CardBody className="text-center">
            <p className="mb-1 text-white/80 text-sm">ทั้งหมด</p>
            <p className="font-bold text-3xl">{stats.total}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600">
          <CardBody className="text-center">
            <p className="mb-1 text-white/80 text-sm">รอยืนยัน</p>
            <p className="font-bold text-3xl">{stats.pending}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600">
          <CardBody className="text-center">
            <p className="mb-1 text-white/80 text-sm">ยืนยันแล้ว</p>
            <p className="font-bold text-3xl">{stats.confirmed}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600">
          <CardBody className="text-center">
            <p className="mb-1 text-white/80 text-sm">เสร็จสิ้น</p>
            <p className="font-bold text-3xl">{stats.completed}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600">
          <CardBody className="text-center">
            <p className="mb-1 text-white/80 text-sm">ยกเลิก</p>
            <p className="font-bold text-3xl">{stats.cancelled}</p>
          </CardBody>
        </Card>
      </section>

      {/* Bookings Table */}
      <section>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              className="mb-6"
              color="secondary"
            >
              <Tab key="all" title={`ทั้งหมด (${stats.total})`} />
              <Tab key="pending" title={`รอยืนยัน (${stats.pending})`} />
              <Tab key="confirmed" title={`ยืนยันแล้ว (${stats.confirmed})`} />
              <Tab key="completed" title={`เสร็จสิ้น (${stats.completed})`} />
              <Tab key="cancelled" title={`ยกเลิก (${stats.cancelled})`} />
            </Tabs>

            <Table
              aria-label="Partner bookings table"
              classNames={{
                wrapper: "bg-transparent",
              }}
            >
              <TableHeader>
                <TableColumn>รหัสจอง</TableColumn>
                <TableColumn>ลูกค้า</TableColumn>
                <TableColumn>โทรศัพท์</TableColumn>
                <TableColumn>แพ็คเกจ</TableColumn>
                <TableColumn>วันที่เริ่ม</TableColumn>
                <TableColumn>วันที่สิ้นสุด</TableColumn>
                <TableColumn>ยอดเงิน</TableColumn>
                <TableColumn>สถานะการชำระ</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>การกระทำ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบข้อมูลการจอง">
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">
                      {booking.booking_number}
                    </TableCell>
                    <TableCell className="font-semibold text-white">
                      {booking.customer_name}
                    </TableCell>
                    <TableCell className="font-mono text-default-400 text-sm">
                      {booking.customer_phone || '-'}
                    </TableCell>
                    <TableCell className="text-default-400">
                      {booking.package_name}
                    </TableCell>
                    <TableCell className="text-default-400">
                      {formatDate(booking.start_date)}
                    </TableCell>
                    <TableCell className="text-default-400">
                      {booking.end_date ? formatDate(booking.end_date) : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-white">
                      {formatCurrency(Number(booking.price_paid))}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusChip(booking.payment_status)}
                    </TableCell>
                    <TableCell>{getStatusChip(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          color="primary"
                          onPress={() => handleViewBooking(booking)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              color="success"
                              variant="flat"
                              onPress={() => handleUpdateStatus(booking.id, 'confirmed')}
                            >
                              ยืนยัน
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              variant="flat"
                              onPress={() => handleUpdateStatus(booking.id, 'cancelled')}
                            >
                              ยกเลิก
                            </Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            onPress={() => handleUpdateStatus(booking.id, 'completed')}
                          >
                            เสร็จสิ้น
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </section>

      {/* Booking Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                รายละเอียดการจอง
              </ModalHeader>
              <ModalBody>
                {selectedBooking && (
                  <div className="space-y-4">
                    <div className="gap-4 grid grid-cols-2">
                      <div>
                        <p className="text-default-500 text-sm">รหัสจอง</p>
                        <p className="font-mono font-semibold">{selectedBooking.booking_number}</p>
                      </div>
                      <div>
                        <p className="text-default-500 text-sm">สถานะ</p>
                        <div className="mt-1">{getStatusChip(selectedBooking.status)}</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="mb-2 font-semibold">ข้อมูลลูกค้า</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-default-500 text-sm">ชื่อ</p>
                          <p className="font-semibold">{selectedBooking.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-default-500 text-sm">อีเมล</p>
                          <p>{selectedBooking.customer_email}</p>
                        </div>
                        <div>
                          <p className="text-default-500 text-sm">โทรศัพท์</p>
                          <p>{selectedBooking.customer_phone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="mb-2 font-semibold">รายละเอียดแพ็คเกจ</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-default-500 text-sm">แพ็คเกจ</p>
                          <p className="font-semibold">{selectedBooking.package_name}</p>
                        </div>
                        <div>
                          <p className="text-default-500 text-sm">ประเภท</p>
                          <p>{selectedBooking.package_type === 'one_time' ? 'ครั้งเดียว' : 'แพ็คเกจ'}</p>
                        </div>
                        {selectedBooking.duration_months && (
                          <div>
                            <p className="text-default-500 text-sm">ระยะเวลา</p>
                            <p>{selectedBooking.duration_months} เดือน</p>
                          </div>
                        )}
                        <div>
                          <p className="text-default-500 text-sm">วันที่เริ่ม</p>
                          <p>{formatDate(selectedBooking.start_date)}</p>
                        </div>
                        {selectedBooking.end_date && (
                          <div>
                            <p className="text-default-500 text-sm">วันที่สิ้นสุด</p>
                            <p>{formatDate(selectedBooking.end_date)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="mb-2 font-semibold">การชำระเงิน</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-default-500 text-sm">ยอดเงิน</p>
                          <p className="font-bold text-green-600 text-2xl">
                            {formatCurrency(Number(selectedBooking.price_paid))}
                          </p>
                        </div>
                        <div>
                          <p className="text-default-500 text-sm">สถานะการชำระเงิน</p>
                          <div className="mt-1">{getPaymentStatusChip(selectedBooking.payment_status)}</div>
                        </div>
                        {selectedBooking.payment_method && (
                          <div>
                            <p className="text-default-500 text-sm">วิธีชำระเงิน</p>
                            <p>{selectedBooking.payment_method}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedBooking.special_requests && (
                      <div className="pt-4 border-t">
                        <h4 className="mb-2 font-semibold">คำขอพิเศษ</h4>
                        <p className="text-default-600">{selectedBooking.special_requests}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <div className="gap-4 grid grid-cols-2 text-sm">
                        <div>
                          <p className="text-default-500">วันที่จอง</p>
                          <p>{formatDate(selectedBooking.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-default-500">อัพเดทล่าสุด</p>
                          <p>{formatDate(selectedBooking.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  ปิด
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
}

export default function PartnerBookingsPage() {
  return (
    <RoleGuard allowedRole="partner">
      <PartnerBookingsContent />
    </RoleGuard>
  );
}
