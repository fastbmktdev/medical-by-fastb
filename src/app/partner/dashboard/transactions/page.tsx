"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
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
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

function PartnerTransactionsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const mockTransactions = [
    {
      id: 'TXN001',
      date: '2024-10-20',
      type: 'รายได้',
      description: 'การจอง Private Class - สมชาย ใจดี',
      amount: '+฿500',
      status: 'completed',
    },
    {
      id: 'TXN002',
      date: '2024-10-19',
      type: 'ถอนเงิน',
      description: 'ถอนเงินเข้าบัญชี xxx-xxx-1234',
      amount: '-฿5,000',
      status: 'completed',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="รายการธุรกรรม"
        headerSubtitle="ดูประวัติธุรกรรมและรายได้"
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
      headerTitle="รายการธุรกรรม"
      headerSubtitle="ดูประวัติธุรกรรมและรายได้"
      roleLabel="พาร์ทเนอร์"
      roleColor="secondary"
      userEmail={user?.email}
    >
      <section className="mb-8">
        <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-success-500 to-success-700 border-none">
            <CardBody>
              <p className="mb-2 text-white/80 text-sm">ยอดคงเหลือ</p>
              <p className="font-mono font-bold text-white text-3xl">฿15,000</p>
              <Button size="sm" className="bg-white/20 backdrop-blur-sm mt-4 text-white">
                ถอนเงิน
              </Button>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">รายได้เดือนนี้</p>
              <p className="font-mono font-bold text-success text-2xl">+฿20,000</p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">ถอนเงินแล้ว</p>
              <p className="font-mono font-bold text-warning text-2xl">฿5,000</p>
            </CardBody>
          </Card>
        </div>
      </section>

      <section>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-white text-xl">ประวัติธุรกรรม</h2>
              <Button
                size="sm"
                color="secondary"
                variant="flat"
                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
              >
                ดาวน์โหลดรายงาน
              </Button>
            </div>
            <Table
              aria-label="Transactions table"
              classNames={{
                wrapper: "bg-transparent",
              }}
            >
              <TableHeader>
                <TableColumn>รหัส</TableColumn>
                <TableColumn>วันที่</TableColumn>
                <TableColumn>ประเภท</TableColumn>
                <TableColumn>รายละเอียด</TableColumn>
                <TableColumn>จำนวนเงิน</TableColumn>
                <TableColumn>สถานะ</TableColumn>
              </TableHeader>
              <TableBody>
                {mockTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-white">{txn.id}</TableCell>
                    <TableCell className="text-default-400">
                      {new Date(txn.date).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={txn.type === 'รายได้' ? 'success' : 'warning'}
                        variant="flat"
                      >
                        {txn.type}
                      </Chip>
                    </TableCell>
                    <TableCell className="text-default-400">{txn.description}</TableCell>
                    <TableCell className={`font-mono font-bold ${txn.amount.startsWith('+') ? 'text-success' : 'text-warning'}`}>
                      {txn.amount}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color="success"
                        variant="flat"
                        startContent={<CheckCircleIcon className="w-3 h-3" />}
                      >
                        สำเร็จ
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

export default function PartnerTransactionsPage() {
  return (
    <RoleGuard allowedRole="partner">
      <PartnerTransactionsContent />
    </RoleGuard>
  );
}
