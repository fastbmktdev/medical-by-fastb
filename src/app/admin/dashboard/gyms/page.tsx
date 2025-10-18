"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RoleGuard from '@/components/auth/RoleGuard';
import DashboardLayout, { MenuItem } from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Input,
  Tabs,
  Tab,
} from '@heroui/react';
import {
  UsersIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import type { Gym } from '@/types/database.types';

function AdminGymsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: gymsData } = await supabase
        .from('gyms')
        .select('*')
        .order('created_at', { ascending: false });

      if (gymsData) {
        setGyms(gymsData);
      }

      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const menuItems: MenuItem[] = [
    { label: 'ภาพรวม', href: '/admin/dashboard', icon: HomeIcon },
    { label: 'จัดการผู้ใช้', href: '/admin/dashboard/users', icon: UsersIcon },
    { label: 'จัดการยิม', href: '/admin/dashboard/gyms', icon: BuildingStorefrontIcon },
    { label: 'อนุมัติยิม', href: '/admin/dashboard/approvals', icon: ClockIcon },
    { label: 'รายงาน', href: '/admin/dashboard/reports', icon: DocumentTextIcon },
    { label: 'สถิติ', href: '/admin/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่าระบบ', href: '/admin/dashboard/settings', icon: Cog6ToothIcon },
  ];

  const getStatusChip = (status?: string) => {
    const statusConfig = {
      pending: { label: 'รอการตรวจสอบ', color: 'warning' as const },
      approved: { label: 'อนุมัติแล้ว', color: 'success' as const },
      rejected: { label: 'ไม่อนุมัติ', color: 'danger' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Chip color={config.color} variant="flat" size="sm">
        {config.label}
      </Chip>
    );
  };

  const filteredGyms = gyms.filter(gym => {
    if (selectedTab === 'all') return true;
    return gym.status === selectedTab;
  });

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="จัดการยิม"
        headerSubtitle="ดูและจัดการยิมทั้งหมดในระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
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
      headerTitle="จัดการยิม"
      headerSubtitle="ดูและจัดการยิมทั้งหมดในระบบ"
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
      userEmail={user?.email}
    >
      {/* Stats */}
      <section className="mb-8">
        <div className="gap-6 grid grid-cols-1 md:grid-cols-4">
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">ยิมทั้งหมด</p>
              <p className="font-bold text-white text-3xl">{gyms.length}</p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">อนุมัติแล้ว</p>
              <p className="font-bold text-success text-3xl">
                {gyms.filter(g => g.status === 'approved').length}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">รออนุมัติ</p>
              <p className="font-bold text-warning text-3xl">
                {gyms.filter(g => g.status === 'pending').length}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">ไม่อนุมัติ</p>
              <p className="font-bold text-danger text-3xl">
                {gyms.filter(g => g.status === 'rejected').length}
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Gyms Table */}
      <section>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="font-bold text-white text-xl">รายชื่อยิม</h2>
              <Input
                placeholder="ค้นหายิม..."
                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                className="max-w-xs"
                classNames={{
                  input: "text-white",
                }}
              />
            </div>

            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              className="mb-6"
              color="danger"
            >
              <Tab key="all" title="ทั้งหมด" />
              <Tab key="approved" title="อนุมัติแล้ว" />
              <Tab key="pending" title="รออนุมัติ" />
              <Tab key="rejected" title="ไม่อนุมัติ" />
            </Tabs>

            <Table
              aria-label="Gyms table"
              classNames={{
                wrapper: "bg-transparent",
              }}
            >
              <TableHeader>
                <TableColumn>ชื่อยิม</TableColumn>
                <TableColumn>ผู้ติดต่อ</TableColumn>
                <TableColumn>โทรศัพท์</TableColumn>
                <TableColumn>สถานที่</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>วันที่สร้าง</TableColumn>
                <TableColumn>การกระทำ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบข้อมูลยิม">
                {filteredGyms.map((gym) => (
                  <TableRow key={gym.id}>
                    <TableCell className="font-semibold text-white">{gym.gym_name}</TableCell>
                    <TableCell className="text-default-400">{gym.contact_name}</TableCell>
                    <TableCell className="font-mono text-default-400 text-sm">{gym.phone}</TableCell>
                    <TableCell className="text-default-400">{gym.location}</TableCell>
                    <TableCell>{getStatusChip(gym.status)}</TableCell>
                    <TableCell className="text-default-400">
                      {gym.created_at ? new Date(gym.created_at).toLocaleDateString('th-TH') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          as={Link}
                          href={`/gyms/${gym.id}`}
                          size="sm"
                          isIconOnly
                          variant="flat"
                          color="primary"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          color="secondary"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          color="danger"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
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

export default function AdminGymsPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminGymsContent />
    </RoleGuard>
  );
}
