"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RoleGuard from '@/components/auth/RoleGuard';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Avatar,
  Chip,
  Divider,
} from '@heroui/react';
import {
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  ShoppingBagIcon,
  HeartIcon,
  ClockIcon,
  ArrowRightIcon,
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

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="border-4 border-t-transparent border-red-600 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

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
      href: '/favorites',
      color: 'danger' as const,
    },
  ];

  return (
    <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-950/30 to-transparent border-white/5 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
          <div className="flex sm:flex-row flex-col items-start gap-6">
            {/* User Avatar */}
            <Avatar
              size="lg"
              icon={<UserIcon className="w-10 h-10" />}
              classNames={{
                base: "bg-gradient-to-br from-red-600 to-red-700",
                icon: "text-white",
              }}
            />

            {/* User Info */}
            <div className="flex-1">
              <h1 className="mb-2 font-bold text-white text-3xl md:text-4xl">
                สวัสดี, {user?.email?.split('@')[0] || 'ผู้ใช้'}!
              </h1>
              <p className="mb-4 text-default-400 text-xl">
                ยินดีต้อนรับสู่แดชบอร์ดของคุณ
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Chip
                  startContent={<CheckCircleIcon className="w-4 h-4" />}
                  color="success"
                  variant="flat"
                >
                  ผู้ใช้ทั่วไป
                </Chip>
                <Chip
                  startContent={<ClockIcon className="w-4 h-4" />}
                  color="primary"
                  variant="flat"
                >
                  สมาชิกตั้งแต่: {new Date(user?.created_at || '').toLocaleDateString('th-TH')}
                </Chip>
              </div>
            </div>

            {/* Become Partner CTA */}
            <div className="w-full sm:w-auto">
              <Button
                as={Link}
                href="/partner/apply"
                color="secondary"
                size="lg"
                endContent={<ArrowRightIcon className="w-5 h-5" />}
                className="font-semibold"
              >
                เป็นพาร์ทเนอร์กับเรา
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        {/* Quick Actions */}
        <section className="mb-12">
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

        {/* Recent Activity */}
        <section className="mb-12">
          <h2 className="mb-6 font-bold text-white text-2xl">กิจกรรมล่าสุด</h2>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="py-12 text-center">
              <CalendarIcon className="mx-auto mb-4 w-16 h-16 text-default-300" />
              <p className="mb-2 text-white text-xl">ยังไม่มีกิจกรรม</p>
              <p className="mb-6 text-default-400">
                เริ่มต้นจองคอร์สหรือซื้อสินค้าเพื่อดูกิจกรรมของคุณที่นี่
              </p>
              <Button
                as={Link}
                href="/gyms"
                color="danger"
                size="lg"
                endContent={<ArrowRightIcon className="w-5 h-5" />}
              >
                ค้นหายิม
              </Button>
            </CardBody>
          </Card>
        </section>

        {/* Profile Settings */}
        <section>
          <h2 className="mb-6 font-bold text-white text-2xl">การตั้งค่า</h2>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="mb-1 font-semibold text-white">อีเมล</h3>
                  <p className="text-default-400 text-sm">{user?.email}</p>
                </div>
              </div>
              <Divider />
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="mb-1 font-semibold text-white">รหัสผ่าน</h3>
                  <p className="text-default-400 text-sm">••••••••</p>
                </div>
                <Button
                  as={Link}
                  href="/reset-password"
                  size="sm"
                  color="danger"
                  variant="flat"
                >
                  เปลี่ยนรหัสผ่าน
                </Button>
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RoleGuard allowedRole="authenticated">
      <DashboardContent />
    </RoleGuard>
  );
}
