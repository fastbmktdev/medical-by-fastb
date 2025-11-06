"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import { Card, CardBody, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Tabs, Tab } from '@heroui/react';
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Load bookings as transactions
        await loadTransactions(user.id);
      }
      
      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);
  
  const loadTransactions = async (userId: string) => {
    try {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*, gyms:gym_id(gym_name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (bookingsData) {
        const mappedTransactions: Transaction[] = bookingsData.map(booking => {
          const gymName = Array.isArray(booking.gyms) ? booking.gyms[0]?.gym_name : booking.gyms?.gym_name || 'Unknown Gym';
          
          let type: 'payment' | 'refund' | 'topup' = 'payment';
          if (booking.payment_status === 'refunded') {
            type = 'refund';
          }
          
          let status: 'completed' | 'pending' | 'failed' = 'pending';
          if (booking.payment_status === 'paid') {
            status = 'completed';
          } else if (booking.payment_status === 'failed') {
            status = 'failed';
          }
          
          return {
            id: booking.booking_number,
            date: booking.created_at,
            type,
            description: booking.package_name ? `จ่ายเงินค่า ${booking.package_name} - ${gymName}` : 'Unknown',
            amount: booking.payment_status === 'refunded' ? Number(booking.price_paid || 0) : -Number(booking.price_paid || 0),
            status,
            reference: booking.booking_number,
          };
        });
        
        setTransactions(mappedTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const menuItems: MenuItem[] = [
    { label: 'การจองของฉัน', href: '/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการโปรด', href: '/dashboard/favorites', icon: HeartIcon },
    { label: 'ประวัติการเงิน', href: '/dashboard/transactions', icon: BanknotesIcon },
    { label: 'โปรไฟล์', href: '/dashboard/profile', icon: UserIcon },
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

  const filteredTransactions = transactions.filter(transaction => {
    if (selectedTab === 'all') return true;
    return transaction.type === selectedTab;
  });

  const totalIncome = transactions
    .filter(t => t.amount > 0 && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = Math.abs(
    transactions
      .filter(t => t.amount < 0 && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const balance = totalIncome - totalExpense;

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
          <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
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

      {/* Transactions Table */}
      <section>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="font-bold text-xl">ประวัติธุรกรรม</h2>
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
