"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
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
} from '@heroui/react';
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  ShoppingBagIcon,
  HeartIcon,
  ArrowRightIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';

/**
 * Authenticated User Dashboard
 * 
 * Dashboard for regular users (authenticated role)
 * Shows user profile, bookings, favorites, and quick actions
 */
interface GymApplication {
  id: string;
  gym_name: string;
  status: string;
  created_at: string;
}

function DashboardContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gymApplication, setGymApplication] = useState<GymApplication | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Check if user has a gym application
        const { data: gymData } = await supabase
          .from('gyms')
          .select('id, gym_name, status, created_at')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setGymApplication(gymData);
      }

      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);

  // Menu items for sidebar
  const menuItems: MenuItem[] = [
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
      headerTitle="แดชบอร์ด"
      headerSubtitle="จัดการข้อมูลและกิจกรรมของคุณ"
      roleLabel="ผู้ใช้ทั่วไป"
      roleColor="primary"
      userEmail={user?.email}
      showPartnerButton={!gymApplication}
    >
      {/* Show Partner Application Status if exists */}
      {gymApplication && gymApplication.status === 'pending' && (
        <section className="mb-8">
          <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-yellow-500/30">
            <CardBody className="gap-4 p-8">
              <div className="flex sm:flex-row flex-col items-start gap-4">
                <div className="flex flex-shrink-0 justify-center items-center bg-yellow-500/20 rounded-full w-16 h-16">
                  <ClockIcon className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2 mb-2">
                    <h2 className="font-bold text-white text-2xl">
                      📋 รอการอนุมัติ Partner
                    </h2>
                    <Chip color="warning" variant="flat" size="lg">
                      กำลังตรวจสอบ
                    </Chip>
                  </div>
                  <p className="mb-4 text-zinc-300 text-lg">
                    คำขอสมัครของคุณสำหรับ <strong className="text-yellow-400">{gymApplication.gym_name}</strong> กำลังรอการตรวจสอบจากทีมงาน
                  </p>
                  <div className="bg-zinc-800/50 mb-4 p-4 border border-zinc-700 rounded-lg">
                    <p className="mb-2 text-white text-sm">📅 ส่งคำขอเมื่อ: <span className="font-mono text-zinc-300">{new Date(gymApplication.created_at).toLocaleDateString('th-TH', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span></p>
                    <p className="text-zinc-400 text-sm">
                      ⏱️ ระยะเวลาการตรวจสอบโดยเฉลี่ย: <strong className="text-white">3-5 วันทำการ</strong>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-white text-sm">🔍 ขั้นตอนการตรวจสอบ:</p>
                    <ul className="space-y-1 ml-4 text-zinc-300 text-sm list-disc">
                      <li>ตรวจสอบความถูกต้องของข้อมูล</li>
                      <li>ตรวจสอบความครบถ้วนของเอกสาร</li>
                      <li>ยืนยันตัวตนและสถานที่</li>
                      <li>แอดมินอนุมัติและเปิดใช้งานบัญชี Partner</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>
      )}

      {gymApplication && gymApplication.status === 'approved' && (
        <section className="mb-8">
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/30">
            <CardBody className="gap-4 p-6">
              <div className="flex items-center gap-4">
                <div className="flex flex-shrink-0 justify-center items-center bg-green-500/20 rounded-full w-12 h-12">
                  <CheckCircleIcon className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-xl">
                    ✅ คำขอของคุณได้รับการอนุมัติแล้ว!
                  </h2>
                  <p className="text-green-300 text-sm">
                    ตอนนี้คุณสามารถเข้าใช้งาน Partner Dashboard ได้แล้ว
                  </p>
                </div>
                <Button
                  as={Link}
                  href="/partner/dashboard"
                  color="success"
                  variant="shadow"
                  size="lg"
                  endContent={<ArrowRightIcon className="w-5 h-5" />}
                  className="ml-auto font-bold"
                >
                  เข้าสู่ Partner Dashboard
                </Button>
              </div>
            </CardBody>
          </Card>
        </section>
      )}

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
      <section>
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
