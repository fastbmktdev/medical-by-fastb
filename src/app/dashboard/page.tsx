"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RoleGuard from '@/components/auth/RoleGuard';
import DashboardLayout, { MenuItem } from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
} from '@heroui/react';
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  ShoppingBagIcon,
  HeartIcon,
  ArrowRightIcon,
  CreditCardIcon,
  BanknotesIcon,
  StarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';

/**
 * Authenticated User Dashboard
 * 
 * Dashboard for regular users (authenticated role)
 * Shows user profile, bookings, favorites, and quick actions
 */
function DashboardContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        setProfileData({
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
        });
      }
      
      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.auth.updateUser({
        data: profileData
      });

      if (error) throw error;

      setIsEditingProfile(false);
      alert('บันทึกข้อมูลสำเร็จ!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // Menu items for sidebar
  const menuItems: MenuItem[] = [
    { label: 'ภาพรวม', href: '/dashboard', icon: HomeIcon },
    { label: 'การจองของฉัน', href: '/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการโปรด', href: '/dashboard/favorites', icon: HeartIcon },
    { label: 'ประวัติการเงิน', href: '/dashboard/transactions', icon: BanknotesIcon },
    { label: 'โปรไฟล์', href: '/dashboard/profile', icon: UserIcon },
  ];

  const quickActions = [
    {
      title: 'ค้นหายิม',
      description: 'ค้นหายิมมวยไทยใกล้คุณ',
      icon: MapPinIcon,
      href: '/gyms',
      color: 'primary' as const,
    },
    {
      title: 'จองคอร์ส',
      description: 'จองคอร์สเทรนนิ่งกับยิมชั้นนำ',
      icon: CalendarIcon,
      href: '/gyms',
      color: 'success' as const,
    },
    {
      title: 'ช้อปสินค้า',
      description: 'อุปกรณ์มวยไทยคุณภาพดี',
      icon: ShoppingBagIcon,
      href: '/shop',
      color: 'secondary' as const,
    },
    {
      title: 'รายการโปรด',
      description: 'ดูยิมและสินค้าที่บันทึกไว้',
      icon: HeartIcon,
      href: '/dashboard/favorites',
      color: 'danger' as const,
    },
  ];

  // Mock booking data
  const mockBookings = [
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
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="แดชบอร์ด"
        headerSubtitle="จัดการข้อมูลและกิจกรรมของคุณ"
        roleLabel="ผู้ใช้ทั่วไป"
        roleColor="primary"
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
      headerTitle="แดชบอร์ด"
      headerSubtitle="จัดการข้อมูลและกิจกรรมของคุณ"
      roleLabel="ผู้ใช้ทั่วไป"
      roleColor="primary"
      userEmail={user?.email}
    >
      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="mb-6 font-bold text-white text-2xl">เมนูด่วน</h2>
        <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card
                key={index}
                as={Link}
                href={action.href}
                isPressable
                isHoverable
                className="bg-default-100/50 backdrop-blur-sm border-none"
              >
                <CardHeader className="flex-col items-start gap-3">
                  <div className={`bg-${action.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">
                      {action.title}
                    </h3>
                    <p className="text-default-400 text-sm">
                      {action.description}
                    </p>
                  </div>
                </CardHeader>
                <CardFooter>
                  <Button
                    size="sm"
                    color={action.color}
                    variant="flat"
                    endContent={<ArrowRightIcon className="w-4 h-4" />}
                    className="w-full"
                  >
                    เริ่มต้น
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Stats Overview */}
      <section className="mb-8">
        <h2 className="mb-6 font-bold text-white text-2xl">สรุปภาพรวม</h2>
        <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-3">
              <div className="flex justify-between items-center">
                <div className="bg-success p-3 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <Chip color="success" variant="flat" size="lg">
                  2 รายการ
                </Chip>
              </div>
              <div>
                <h3 className="font-bold text-white text-2xl">การจองทั้งหมด</h3>
                <p className="text-default-400 text-sm">1 กำลังจะมาถึง</p>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-3">
              <div className="flex justify-between items-center">
                <div className="bg-danger p-3 rounded-lg">
                  <HeartIcon className="w-6 h-6 text-white" />
                </div>
                <Chip color="danger" variant="flat" size="lg">
                  2 รายการ
                </Chip>
              </div>
              <div>
                <h3 className="font-bold text-white text-2xl">ยิมโปรด</h3>
                <p className="text-default-400 text-sm">รายการที่บันทึกไว้</p>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-3">
              <div className="flex justify-between items-center">
                <div className="bg-warning p-3 rounded-lg">
                  <BanknotesIcon className="w-6 h-6 text-white" />
                </div>
                <Chip color="success" variant="flat" size="lg">
                  ฿2,000
                </Chip>
              </div>
              <div>
                <h3 className="font-bold text-white text-2xl">ยอดคงเหลือ</h3>
                <p className="text-default-400 text-sm">ในกระเป๋าเงิน</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Recent Bookings */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-white text-2xl">การจองล่าสุด</h2>
          <Button
            as={Link}
            href="/dashboard/bookings"
            size="sm"
            variant="flat"
            color="danger"
            endContent={<ArrowRightIcon className="w-4 h-4" />}
          >
            ดูทั้งหมด
          </Button>
        </div>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <Table
              aria-label="Recent bookings table"
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
              </TableHeader>
              <TableBody>
                {mockBookings.slice(0, 3).map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-semibold text-white">{booking.gym}</TableCell>
                    <TableCell className="text-default-400">{booking.service}</TableCell>
                    <TableCell className="text-default-400">{new Date(booking.date).toLocaleDateString('th-TH')}</TableCell>
                    <TableCell className="text-default-400">{booking.time}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={booking.status === 'upcoming' ? 'warning' : 'success'}
                        variant="flat"
                      >
                        {booking.status === 'upcoming' ? 'กำลังจะมาถึง' : 'เสร็จสิ้น'}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </section>

      {/* Become Partner CTA */}
      <section>
        <Card className="bg-gradient-to-br from-purple-950/50 to-transparent backdrop-blur-sm border border-purple-500/20">
          <CardBody className="sm:flex-row flex-col items-center gap-6 p-8">
            <div className="flex-1 sm:text-left text-center">
              <h3 className="mb-2 font-bold text-white text-2xl">เป็นพาร์ทเนอร์กับเรา</h3>
              <p className="text-default-400 text-lg">
                เปิดยิมของคุณให้ผู้ใช้ได้จองและเข้าถึงฐานลูกค้ากว้างขึ้น
              </p>
            </div>
            <Button
              as={Link}
              href="/partner/apply"
              color="secondary"
              size="lg"
              endContent={<ArrowRightIcon className="w-5 h-5" />}
              className="font-bold"
            >
              สมัครเลย
            </Button>
          </CardBody>
        </Card>
      </section>
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <RoleGuard allowedRole="authenticated">
      <DashboardContent />
    </RoleGuard>
  );
}
