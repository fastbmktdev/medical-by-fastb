"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RoleGuard from '@/components/auth/RoleGuard';
import DashboardLayout, { MenuItem } from '@/components/layout/DashboardLayout';
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
} from '@heroui/react';
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  CalendarIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  HomeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface Booking {
  id: string;
  customer: string;
  service: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  amount: string;
  phone?: string;
}

function PartnerBookingsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);

  const menuItems: MenuItem[] = [
    { label: 'ข้อมูลยิม', href: '/partner/dashboard/gym', icon: BuildingStorefrontIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'สถิติ', href: '/partner/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่า', href: '/partner/dashboard/settings', icon: Cog6ToothIcon },
  ];

  // Mock bookings data
  const mockBookings: Booking[] = [
    {
      id: 'BK001',
      customer: 'สมชาย ใจดี',
      service: 'มวยไทย - Private Class',
      date: '2024-10-25',
      time: '10:00-11:00',
      status: 'confirmed',
      amount: '฿500',
      phone: '081-234-5678',
    },
    {
      id: 'BK002',
      customer: 'สมหญิง รักสุข',
      service: 'คลาสกลุ่ม',
      date: '2024-10-26',
      time: '14:00-15:00',
      status: 'pending',
      amount: '฿300',
      phone: '082-345-6789',
    },
    {
      id: 'BK003',
      customer: 'วิชัย มานะ',
      service: 'Private Class',
      date: '2024-10-20',
      time: '09:00-10:00',
      status: 'completed',
      amount: '฿600',
      phone: '083-456-7890',
    },
    {
      id: 'BK004',
      customer: 'สุดา สวย',
      service: 'Fitness',
      date: '2024-10-15',
      time: '16:00-17:00',
      status: 'cancelled',
      amount: '฿400',
      phone: '084-567-8901',
    },
  ];

  const getStatusChip = (status: Booking['status']) => {
    const statusConfig = {
      confirmed: {
        label: 'ยืนยันแล้ว',
        color: 'success' as const,
        icon: CheckCircleIcon,
      },
      pending: {
        label: 'รอยืนยัน',
        color: 'warning' as const,
        icon: ClockIcon,
      },
      completed: {
        label: 'เสร็จสิ้น',
        color: 'primary' as const,
        icon: CheckCircleIcon,
      },
      cancelled: {
        label: 'ยกเลิก',
        color: 'danger' as const,
        icon: XCircleIcon,
      },
    };

    const config = statusConfig[status];
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

  const filteredBookings = mockBookings.filter(booking => {
    if (selectedTab === 'all') return true;
    return booking.status === selectedTab;
  });

  const stats = {
    total: mockBookings.length,
    confirmed: mockBookings.filter(b => b.status === 'confirmed').length,
    pending: mockBookings.filter(b => b.status === 'pending').length,
    completed: mockBookings.filter(b => b.status === 'completed').length,
    cancelled: mockBookings.filter(b => b.status === 'cancelled').length,
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
          <div className="border-4 border-t-transparent border-red-600 rounded-full w-12 h-12 animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle="ประวัติการจอง"
      headerSubtitle="จัดการการจองของลูกค้า"
      roleLabel="พาร์ทเนอร์"
      roleColor="secondary"
      userEmail={user?.email}
    >
      {/* Stats Overview */}
      <section className="mb-8">
        <div className="gap-6 grid grid-cols-2 md:grid-cols-5">
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">ทั้งหมด</p>
              <p className="font-bold text-white text-3xl">{stats.total}</p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">ยืนยันแล้ว</p>
              <p className="font-bold text-success text-3xl">{stats.confirmed}</p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">รอยืนยัน</p>
              <p className="font-bold text-warning text-3xl">{stats.pending}</p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">เสร็จสิ้น</p>
              <p className="font-bold text-primary text-3xl">{stats.completed}</p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">ยกเลิก</p>
              <p className="font-bold text-danger text-3xl">{stats.cancelled}</p>
            </CardBody>
          </Card>
        </div>
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
              <Tab key="all" title="ทั้งหมด" />
              <Tab key="pending" title="รอยืนยัน" />
              <Tab key="confirmed" title="ยืนยันแล้ว" />
              <Tab key="completed" title="เสร็จสิ้น" />
              <Tab key="cancelled" title="ยกเลิก" />
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
                <TableColumn>บริการ</TableColumn>
                <TableColumn>วันที่</TableColumn>
                <TableColumn>เวลา</TableColumn>
                <TableColumn>ยอดเงิน</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>การกระทำ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบข้อมูลการจอง">
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-white">{booking.id}</TableCell>
                    <TableCell className="font-semibold text-white">{booking.customer}</TableCell>
                    <TableCell className="font-mono text-default-400 text-sm">{booking.phone}</TableCell>
                    <TableCell className="text-default-400">{booking.service}</TableCell>
                    <TableCell className="text-default-400">
                      {new Date(booking.date).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell className="text-default-400">{booking.time}</TableCell>
                    <TableCell className="font-mono text-white">{booking.amount}</TableCell>
                    <TableCell>{getStatusChip(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          color="primary"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              color="success"
                              variant="flat"
                            >
                              อนุมัติ
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              variant="flat"
                            >
                              ปฏิเสธ
                            </Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
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
