"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RoleGuard from '@/components/auth/RoleGuard';
import DashboardLayout, { MenuItem } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardBody,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
} from '@heroui/react';
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  HeartIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';

interface Booking {
  id: string;
  gym: string;
  service: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  amount: string;
}

function BookingsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
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
    { label: 'การจองของฉัน', href: '/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการโปรด', href: '/dashboard/favorites', icon: HeartIcon },
    { label: 'ประวัติการเงิน', href: '/dashboard/transactions', icon: BanknotesIcon },
    { label: 'โปรไฟล์', href: '/dashboard/profile', icon: UserIcon },
  ];

  // Mock bookings data
  const mockBookings: Booking[] = [
    {
      id: '1',
      gym: 'Tiger Muay Thai Gym',
      service: 'Private Class',
      date: '2024-10-25',
      time: '10:00-11:00',
      status: 'upcoming',
      amount: '฿500',
    },
    {
      id: '2',
      gym: 'Fairtex Training Center',
      service: 'คลาสกลุ่ม',
      date: '2024-10-20',
      time: '14:00-15:00',
      status: 'completed',
      amount: '฿300',
    },
    {
      id: '3',
      gym: 'Yokkao Training Center',
      service: 'Private Class',
      date: '2024-10-15',
      time: '09:00-10:00',
      status: 'completed',
      amount: '฿600',
    },
    {
      id: '4',
      gym: 'Phuket Fight Club',
      service: 'คลาสกลุ่ม',
      date: '2024-10-10',
      time: '16:00-17:00',
      status: 'cancelled',
      amount: '฿400',
    },
  ];

  const getStatusChip = (status: Booking['status']) => {
    const statusConfig = {
      upcoming: {
        label: 'กำลังจะมาถึง',
        color: 'warning' as const,
        icon: ClockIcon
      },
      completed: {
        label: 'เสร็จสิ้น',
        color: 'success' as const,
        icon: CheckCircleIcon
      },
      cancelled: {
        label: 'ยกเลิก',
        color: 'danger' as const,
        icon: XCircleIcon
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
    upcoming: mockBookings.filter(b => b.status === 'upcoming').length,
    completed: mockBookings.filter(b => b.status === 'completed').length,
    cancelled: mockBookings.filter(b => b.status === 'cancelled').length,
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="การจองของฉัน"
        headerSubtitle="จัดการและดูประวัติการจองทั้งหมด"
        roleLabel="ผู้ใช้ทั่วไป"
        roleColor="primary"
        userEmail={user?.email}
        showPartnerButton={true}
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
      headerTitle="การจองของฉัน"
      headerSubtitle="จัดการและดูประวัติการจองทั้งหมด"
      roleLabel="ผู้ใช้ทั่วไป"
      roleColor="primary"
      userEmail={user?.email}
      showPartnerButton={true}
    >
      {/* Stats Overview */}
      <section className="mb-8">
        <div className="gap-6 grid grid-cols-1 md:grid-cols-4">
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">ทั้งหมด</p>
              <p className="font-bold text-white text-3xl">{stats.total}</p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">กำลังจะมาถึง</p>
              <p className="font-bold text-warning text-3xl">{stats.upcoming}</p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">เสร็จสิ้น</p>
              <p className="font-bold text-success text-3xl">{stats.completed}</p>
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
              color="danger"
            >
              <Tab key="all" title="ทั้งหมด" />
              <Tab key="upcoming" title="กำลังจะมาถึง" />
              <Tab key="completed" title="เสร็จสิ้น" />
              <Tab key="cancelled" title="ยกเลิก" />
            </Tabs>

            <Table
              aria-label="Bookings table"
              classNames={{
                wrapper: "bg-transparent",
              }}
            >
              <TableHeader>
                <TableColumn>ยิม</TableColumn>
                <TableColumn>บริการ</TableColumn>
                <TableColumn>วันที่</TableColumn>
                <TableColumn>เวลา</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>ยอดเงิน</TableColumn>
                <TableColumn>การกระทำ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบข้อมูลการจอง">
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-semibold text-white">{booking.gym}</TableCell>
                    <TableCell className="text-default-400">{booking.service}</TableCell>
                    <TableCell className="text-default-400">
                      {new Date(booking.date).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell className="text-default-400">{booking.time}</TableCell>
                    <TableCell>{getStatusChip(booking.status)}</TableCell>
                    <TableCell className="font-mono text-white">{booking.amount}</TableCell>
                    <TableCell>
                      {booking.status === 'upcoming' && (
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                        >
                          ยกเลิก
                        </Button>
                      )}
                      {booking.status === 'completed' && (
                        <Button
                          size="sm"
                          color="secondary"
                          variant="flat"
                        >
                          รีวิว
                        </Button>
                      )}
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

export default function BookingsPage() {
  return (
    <RoleGuard allowedRole="authenticated">
      <BookingsContent />
    </RoleGuard>
  );
}
