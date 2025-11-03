"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import GamificationWidget from '@/components/features/gamification/GamificationWidget';
import Link from 'next/link';
import { Card, CardBody, Button, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
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

interface BookingWithGym {
  id: string;
  booking_number: string;
  package_name: string;
  start_date: string;
  status: string;
  payment_status: string;
  price_paid: number;
  gyms?: {
    gym_name: string;
    slug: string;
  } | null;
}

function DashboardContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gymApplication, setGymApplication] = useState<GymApplication | null>(null);
  const [recentBookings, setRecentBookings] = useState<BookingWithGym[]>([]);

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

        // Fetch recent bookings
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_number,
            package_name,
            start_date,
            status,
            payment_status,
            price_paid,
            gyms:gym_id (
              gym_name,
              slug
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (bookingsData) {
          // Map the data to ensure gyms is a single object, not an array
          const mappedBookings = bookingsData.map(booking => ({
            ...booking,
            gyms: Array.isArray(booking.gyms) ? booking.gyms[0] : booking.gyms
          })) as BookingWithGym[];
          setRecentBookings(mappedBookings);
        }
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
    { label: 'Gamification', href: '/dashboard/gamification', icon: HomeIcon },
    { label: 'Affiliate', href: '/dashboard/affiliate', icon: UserIcon },
    { label: 'โปรไฟล์', href: '/dashboard/profile', icon: UserIcon },
  ];

  // Calculate stats from real bookings
  // const upcomingBookings = recentBookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  // const totalBookings = recentBookings.length;

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
          <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
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
                    <h2 className="font-bold text-2xl">
                      📋 รอการอนุมัติ Partner
                    </h2>
                    <Chip color="warning" variant="flat" size="lg">
                      กำลังตรวจสอบ
                    </Chip>
                  </div>
                  <p className="mb-4 text-zinc-300 text-lg">
                    คำขอสมัครของคุณสำหรับ <strong className="text-yellow-400">{gymApplication.gym_name}</strong> กำลังรอการตรวจสอบจากทีมงาน
                  </p>
                  <div className="bg-zinc-950/50 mb-4 p-4 border border-zinc-700 rounded-lg">
                    <p className="mb-2 text-sm">📅 ส่งคำขอเมื่อ: <span className="font-mono text-zinc-300">{new Date(gymApplication.created_at).toLocaleDateString('th-TH', { 
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
                    <p className="font-semibold text-sm">🔍 ขั้นตอนการตรวจสอบ:</p>
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
                  <h2 className="font-bold text-xl">
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

      {/* Gamification Widget */}
      <section className="mb-8">
        <GamificationWidget />
      </section>

      {/* Recent Bookings */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-2xl">การจองล่าสุด</h2>
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
                <TableColumn>เลขที่การจอง</TableColumn>
                <TableColumn>ยิม</TableColumn>
                <TableColumn>แพ็คเกจ</TableColumn>
                <TableColumn>วันที่</TableColumn>
                <TableColumn>ยอดเงิน</TableColumn>
                <TableColumn>สถานะ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ยังไม่มีการจอง">
                {recentBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-sm">{booking.booking_number}</TableCell>
                    <TableCell className="font-semibold text-white">{booking.gyms?.gym_name || 'N/A'}</TableCell>
                    <TableCell className="text-default-400">{booking.package_name}</TableCell>
                    <TableCell className="text-default-400">
                      {new Date(booking.start_date).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-white">฿{Number(booking.price_paid).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={
                          booking.status === 'pending' ? 'default' :
                          booking.status === 'confirmed' ? 'warning' :
                          booking.status === 'completed' ? 'success' : 'danger'
                        }
                        variant="flat"
                      >
                        {
                          booking.status === 'pending' ? 'รอดำเนินการ' :
                          booking.status === 'confirmed' ? 'ยืนยันแล้ว' :
                          booking.status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'
                        }
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
