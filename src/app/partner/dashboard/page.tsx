"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RoleGuard from '@/components/auth/RoleGuard';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardBody,
  Button,
  Avatar,
  Chip,
  Divider,
} from '@heroui/react';
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  PencilIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import type { Gym } from '@/types/database.types';

/**
 * Partner Dashboard
 * 
 * Dashboard for gym partners (partner role)
 * Shows gym statistics, bookings, revenue, and gym management
 */
function PartnerDashboardContent() {
  const supabase = createClient();
  const [gym, setGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: gymData } = await supabase
          .from('gyms')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setGym(gymData);
      }

      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="border-4 border-t-transparent border-red-600 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  const getStatusChip = (status?: string) => {
    const statusConfig = {
      pending: { label: 'รอการตรวจสอบ', color: 'warning' as const },
      approved: { label: 'อนุมัติแล้ว', color: 'success' as const },
      rejected: { label: 'ไม่อนุมัติ', color: 'danger' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Chip color={config.color} variant="flat" size="lg">
        {config.label}
      </Chip>
    );
  };

  const stats = [
    {
      title: 'การจองทั้งหมด',
      value: '0',
      change: '+0%',
      icon: CalendarIcon,
      color: 'primary',
    },
    {
      title: 'ลูกค้าที่ใช้บริการ',
      value: '0',
      change: '+0%',
      icon: UsersIcon,
      color: 'success',
    },
    {
      title: 'รายได้เดือนนี้',
      value: '฿0',
      change: '+0%',
      icon: CurrencyDollarIcon,
      color: 'warning',
    },
    {
      title: 'คะแนนความพึงพอใจ',
      value: '0.0',
      change: '-',
      icon: ChartBarIcon,
      color: 'secondary',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-950/30 to-transparent border-white/5 border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
          <div className="flex sm:flex-row flex-col items-start gap-6">
            {/* Gym Icon */}
            <Avatar
              size="lg"
              icon={<BuildingStorefrontIcon className="w-10 h-10" />}
              classNames={{
                base: "bg-gradient-to-br from-purple-600 to-purple-700",
                icon: "text-white",
              }}
            />

            {/* Gym Info */}
            <div className="flex-1">
              <h1 className="mb-2 font-bold text-white text-3xl md:text-4xl">
                {gym?.gym_name || 'แดshบอร์ดพาร์ทเนอร์'}
              </h1>
              <p className="mb-4 text-default-400 text-xl">
                จัดการยิมและดูสถิติของคุณ
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Chip
                  startContent={<CheckCircleIcon className="w-4 h-4" />}
                  color="secondary"
                  variant="flat"
                >
                  พาร์ทเนอร์
                </Chip>
                {gym && getStatusChip(gym.status)}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              {gym ? (
                <>
                  <Button
                    as={Link}
                    href={`/gyms/${gym.id}`}
                    variant="bordered"
                    startContent={<EyeIcon className="w-5 h-5" />}
                    className="font-semibold"
                  >
                    ดูหน้ายิม
                  </Button>
                  <Button
                    as={Link}
                    href="/partner/gym/edit"
                    color="secondary"
                    startContent={<PencilIcon className="w-5 h-5" />}
                    className="font-semibold"
                  >
                    แก้ไขข้อมูล
                  </Button>
                </>
              ) : (
                <Button
                  as={Link}
                  href="/partner/apply"
                  color="secondary"
                  size="lg"
                  className="font-semibold"
                >
                  สมัครเป็นพาร์ทเนอร์
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        {gym ? (
          <>
            {/* Statistics Cards */}
            <section className="mb-12">
              <h2 className="mb-6 font-bold text-white text-2xl">สถิติภาพรวม</h2>
              <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card
                      key={index}
                      className="bg-default-100/50 backdrop-blur-sm border-none"
                    >
                      <CardBody className="gap-4">
                        <div className="flex justify-between items-start">
                          <div className={`bg-${stat.color} p-3 rounded-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <Chip
                            size="sm"
                            color="success"
                            variant="flat"
                            startContent={<ArrowTrendingUpIcon className="w-3 h-3" />}
                          >
                            {stat.change}
                          </Chip>
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-2xl">
                            {stat.value}
                          </h3>
                          <p className="text-default-400 text-sm">
                            {stat.title}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Gym Information */}
            <section className="mb-12">
              <h2 className="mb-6 font-bold text-white text-2xl">ข้อมูลยิม</h2>
              <Card className="bg-default-100/50 backdrop-blur-sm border-none">
                <CardBody className="gap-6">
                  <div className="gap-8 grid grid-cols-1 lg:grid-cols-2">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-2 font-semibold text-white">ชื่อยิม</h3>
                        <p className="text-default-400">{gym.gym_name}</p>
                      </div>
                      <Divider />
                      <div>
                        <h3 className="mb-2 font-semibold text-white">ผู้ติดต่อ</h3>
                        <p className="text-default-400">{gym.contact_name}</p>
                      </div>
                      <Divider />
                      <div>
                        <h3 className="mb-2 font-semibold text-white">โทรศัพท์</h3>
                        <p className="font-mono text-default-400">{gym.phone}</p>
                      </div>
                      <Divider />
                      <div>
                        <h3 className="mb-2 font-semibold text-white">อีเมล</h3>
                        <p className="font-mono text-default-400">{gym.email}</p>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-2 font-semibold text-white">ที่อยู่</h3>
                        <p className="text-default-400">{gym.location}</p>
                      </div>
                      <Divider />
                      {gym.services && gym.services.length > 0 && (
                        <div>
                          <h3 className="mb-3 font-semibold text-white">บริการ</h3>
                          <div className="flex flex-wrap gap-2">
                            {gym.services.map((service, idx) => (
                              <Chip
                                key={idx}
                                color="secondary"
                                variant="flat"
                                size="sm"
                              >
                                {service}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Images */}
                  {gym.images && gym.images.length > 0 && (
                    <>
                      <Divider />
                      <div>
                        <h3 className="mb-4 font-semibold text-white">รูปภาพ</h3>
                        <div className="gap-4 grid grid-cols-2 md:grid-cols-4">
                          {gym.images.map((image, idx) => (
                            <div key={idx} className="relative rounded-lg w-full h-32 overflow-hidden">
                              <Image
                                src={image}
                                alt={`Gym image ${idx + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>
            </section>

            {/* Recent Bookings */}
            <section>
              <h2 className="mb-6 font-bold text-white text-2xl">การจองล่าสุด</h2>
              <Card className="bg-default-100/50 backdrop-blur-sm border-none">
                <CardBody className="py-12 text-center">
                  <CalendarIcon className="mx-auto mb-4 w-16 h-16 text-default-300" />
                  <p className="mb-2 text-white text-xl">ยังไม่มีการจอง</p>
                  <p className="text-default-400">
                    เมื่อมีลูกค้าจองคอร์สของคุณ จะแสดงที่นี่
                  </p>
                </CardBody>
              </Card>
            </section>
          </>
        ) : (
          /* No Gym Yet */
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody className="py-12 text-center">
              <BuildingStorefrontIcon className="mx-auto mb-6 w-20 h-20 text-default-300" />
              <h2 className="mb-4 font-bold text-white text-2xl">
                ยังไม่มีข้อมูลยิม
              </h2>
              <p className="mx-auto mb-8 max-w-md text-default-400 text-xl">
                เริ่มต้นสมัครเป็นพาร์ทเนอร์กับเราเพื่อเข้าถึงฐานลูกค้าที่กว้างขึ้น
              </p>
              <Button
                as={Link}
                href="/partner/apply"
                color="secondary"
                size="lg"
                startContent={<BuildingStorefrontIcon className="w-6 h-6" />}
                className="font-bold"
              >
                สมัครเป็นพาร์ทเนอร์
              </Button>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function PartnerDashboardPage() {
  return (
    <RoleGuard allowedRole="partner">
      <PartnerDashboardContent />
    </RoleGuard>
  );
}
