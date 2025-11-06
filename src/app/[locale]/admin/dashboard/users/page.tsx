"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Input } from '@heroui/react';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';

interface UserRole {
  user_id: string;
  role: string;
  email?: string;
  created_at?: string;
}

function AdminUsersContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Fetch all users from user_roles
      const { data: usersData } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersData) {
        setUsers(usersData);
      }

      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const getRoleChip = (role: string) => {
    const roleConfig = {
      admin: { label: 'ผู้ดูแลระบบ', color: 'danger' as const },
      partner: { label: 'พาร์ทเนอร์', color: 'secondary' as const },
      authenticated: { label: 'ผู้ใช้ทั่วไป', color: 'primary' as const },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.authenticated;

    return (
      <Chip color={config.color} variant="flat" size="sm">
        {config.label}
      </Chip>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการผู้ใช้"
        headerSubtitle="ดูและจัดการผู้ใช้ทั้งหมดในระบบ"
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
      menuItems={adminMenuItems}
      headerTitle="จัดการผู้ใช้"
      headerSubtitle="ดูและจัดการผู้ใช้ทั้งหมดในระบบ"
      roleLabel="ผู้ดูแลระบบ"
      roleColor="danger"
      userEmail={user?.email}
    >
      {/* Stats */}
      <section className="mb-8">
        <div className="gap-6 grid grid-cols-1 md:grid-cols-4">
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">ผู้ใช้ทั้งหมด</p>
              <p className="font-bold text-3xl">{users.length}</p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">ผู้ดูแลระบบ</p>
              <p className="font-bold text-danger text-3xl">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">พาร์ทเนอร์</p>
              <p className="font-bold text-secondary text-3xl">
                {users.filter(u => u.role === 'partner').length}
              </p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">ผู้ใช้ทั่วไป</p>
              <p className="font-bold text-primary text-3xl">
                {users.filter(u => u.role === 'authenticated').length}
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Users Table */}
      <section>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="font-bold text-xl">รายชื่อผู้ใช้</h2>
              <Input
                placeholder="ค้นหาผู้ใช้..."
                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                className="max-w-xs"
                classNames={{
                  input: "text-white",
                }}
              />
            </div>

            <Table
              aria-label="Users table"
              classNames={{
                wrapper: "bg-transparent border border-default-200 rounded-lg overflow-hidden",
                th: 'bg-default-100/80 text-default-700 font-semibold text-sm border-b border-default-200 py-4',
                td: 'border-b border-default-200/50 py-4',
                tr: 'hover:bg-default-50/50 transition-colors',
              }}
              removeWrapper={false}
            >
              <TableHeader>
                <TableColumn>USER ID</TableColumn>
                <TableColumn>บทบาท</TableColumn>
                <TableColumn>วันที่สร้าง</TableColumn>
                <TableColumn>การกระทำ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบข้อมูลผู้ใช้">
                {users.map((userRole) => (
                  <TableRow key={userRole.user_id}>
                    <TableCell className="font-mono text-sm">{userRole.user_id}</TableCell>
                    <TableCell>{getRoleChip(userRole.role)}</TableCell>
                    <TableCell className="text-default-400">
                      {userRole.created_at ? new Date(userRole.created_at).toLocaleDateString('th-TH') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          color="primary"
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

export default function AdminUsersPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminUsersContent />
    </RoleGuard>
  );
}
