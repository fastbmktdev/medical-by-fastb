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
  Tabs,
  Tab,
} from '@heroui/react';
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  HeartIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PlusCircleIcon,
  MinusCircleIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';

interface Transaction {
  id: string;
  date: string;
  type: 'payment' | 'refund' | 'topup';
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
}

function TransactionsContent() {
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

  // Mock transactions data
  const mockTransactions: Transaction[] = [
    {
      id: 'TXN001',
      date: '2024-10-20',
      type: 'payment',
      description: 'จ่ายเงินค่า Private Class - Tiger Muay Thai Gym',
      amount: -500,
      status: 'completed',
      reference: 'BK001',
    },
    {
      id: 'TXN002',
      date: '2024-10-19',
      type: 'topup',
      description: 'เติมเงินเข้ากระเป๋า',
      amount: 2000,
      status: 'completed',
      reference: 'TP001',
    },
    {
      id: 'TXN003',
      date: '2024-10-15',
      type: 'payment',
      description: 'จ่ายเงินค่าคลาสกลุ่ม - Fairtex Training Center',
      amount: -300,
      status: 'completed',
      reference: 'BK002',
    },
    {
      id: 'TXN004',
      date: '2024-10-10',
      type: 'refund',
      description: 'คืนเงินจากการยกเลิกการจอง',
      amount: 400,
      status: 'completed',
      reference: 'RF001',
    },
    {
      id: 'TXN005',
      date: '2024-10-05',
      type: 'payment',
      description: 'จ่ายเงินค่า Private Class - Yokkao Training Center',
      amount: -600,
      status: 'pending',
      reference: 'BK003',
    },
  ];

  const getTypeChip = (type: Transaction['type']) => {
    const typeConfig = {
      payment: {
        label: 'จ่ายเงิน',
        color: 'danger' as const,
        icon: MinusCircleIcon,
      },
      refund: {
        label: 'คืนเงิน',
        color: 'success' as const,
        icon: PlusCircleIcon,
      },
      topup: {
        label: 'เติมเงิน',
        color: 'primary' as const,
        icon: PlusCircleIcon,
      },
    };

    const config = typeConfig[type];
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

  const getStatusChip = (status: Transaction['status']) => {
    const statusConfig = {
      completed: {
        label: 'สำเร็จ',
        color: 'success' as const,
        icon: CheckCircleIcon,
      },
      pending: {
        label: 'รอดำเนินการ',
        color: 'warning' as const,
        icon: ClockIcon,
      },
      failed: {
        label: 'ล้มเหลว',
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

  const filteredTransactions = mockTransactions.filter(transaction => {
    if (selectedTab === 'all') return true;
    return transaction.type === selectedTab;
  });

  const totalIncome = mockTransactions
    .filter(t => t.amount > 0 && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = Math.abs(
    mockTransactions
      .filter(t => t.amount < 0 && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const balance = 2000; // Mock balance

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="ประวัติการเงิน"
        headerSubtitle="ดูประวัติธุรกรรมและยอดคงเหลือ"
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
      headerTitle="ประวัติการเงิน"
      headerSubtitle="ดูประวัติธุรกรรมและยอดคงเหลือ"
      roleLabel="ผู้ใช้ทั่วไป"
      roleColor="primary"
      userEmail={user?.email}
      showPartnerButton={true}
    >
      {/* Stats Overview */}
      <section className="mb-8">
        <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-success-500 to-success-700 border-none">
            <CardBody className="gap-2">
              <p className="text-white/80 text-sm">ยอดคงเหลือ</p>
              <p className="font-mono font-bold text-white text-3xl">฿{balance.toLocaleString()}</p>
              <Button
                size="sm"
                className="bg-white/20 backdrop-blur-sm mt-2 text-white"
                startContent={<PlusCircleIcon className="w-4 h-4" />}
              >
                เติมเงิน
              </Button>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">รายรับทั้งหมด</p>
              <p className="font-mono font-bold text-success text-2xl">
                +฿{totalIncome.toLocaleString()}
              </p>
              <p className="text-default-400 text-xs">จากการคืนเงินและเติมเงิน</p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">รายจ่ายทั้งหมด</p>
              <p className="font-mono font-bold text-danger text-2xl">
                -฿{totalExpense.toLocaleString()}
              </p>
              <p className="text-default-400 text-xs">จากการจองและซื้อสินค้า</p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Transactions Table */}
      <section>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="font-bold text-white text-xl">ประวัติธุรกรรม</h2>
              <Button
                color="primary"
                variant="flat"
                size="sm"
                startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
              >
                ดาวน์โหลดรายงาน
              </Button>
            </div>

            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              className="mb-6"
              color="danger"
            >
              <Tab key="all" title="ทั้งหมด" />
              <Tab key="payment" title="จ่ายเงิน" />
              <Tab key="topup" title="เติมเงิน" />
              <Tab key="refund" title="คืนเงิน" />
            </Tabs>

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
                <TableColumn>อ้างอิง</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบข้อมูลธุรกรรม">
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-white">{transaction.id}</TableCell>
                    <TableCell className="text-default-400">
                      {new Date(transaction.date).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell>{getTypeChip(transaction.type)}</TableCell>
                    <TableCell className="text-default-400">{transaction.description}</TableCell>
                    <TableCell
                      className={`font-mono font-bold ${
                        transaction.amount > 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}฿{Math.abs(transaction.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusChip(transaction.status)}</TableCell>
                    <TableCell className="font-mono text-default-400 text-sm">
                      {transaction.reference || '-'}
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

export default function TransactionsPage() {
  return (
    <RoleGuard allowedRole="authenticated">
      <TransactionsContent />
    </RoleGuard>
  );
}
