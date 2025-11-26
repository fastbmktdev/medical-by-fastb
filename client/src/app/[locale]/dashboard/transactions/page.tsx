"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@shared/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, dashboardMenuItems } from '@/components/shared';
import { Card, CardBody, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Tabs, Tab } from '@heroui/react';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import { Loading } from '@/components/design-system/primitives/Loading';

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

  const loadTransactions = useCallback(async (userId: string) => {
    try {
      const { data: bookingsData } = await supabase
        .from('appointments')
        .select('*, hospitals:hospital_id(hospital_name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (bookingsData) {
        const mappedTransactions: Transaction[] = bookingsData.map((appointment: {
          booking_number: string;
          created_at: string;
          package_name: string | null;
          payment_status: string;
          price_paid: number | null;
          hospitals?: {
            hospital_name: string;
          } | {
            hospital_name: string;
          }[] | null;
        }) => {
          const hospitalName = Array.isArray(appointment.hospitals) ? appointment.hospitals[0]?.hospital_name : appointment.hospitals?.hospital_name || 'Unknown hospital';
          
          let type: 'payment' | 'refund' | 'topup' = 'payment';
          if (appointment.payment_status === 'refunded') {
            type = 'refund';
          }
          
          let status: 'completed' | 'pending' | 'failed' = 'pending';
          if (appointment.payment_status === 'paid') {
            status = 'completed';
          } else if (appointment.payment_status === 'failed') {
            status = 'failed';
          }
          
          return {
            id: appointment.booking_number,
            date: appointment.created_at,
            type,
            description: appointment.package_name ? `จ่ายเงินค่า ${appointment.package_name} - ${hospitalName}` : 'Unknown',
            amount: appointment.payment_status === 'refunded' ? Number(appointment.price_paid || 0) : -Number(appointment.price_paid || 0),
            status,
            reference: appointment.booking_number,
          };
        });
        
        setTransactions(mappedTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, [supabase]);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Load appointments as transactions
        await loadTransactions(user.id);
      }
      
      setIsLoading(false);
    }
    loadUser();
  }, [supabase, loadTransactions]);

  const stats = useMemo(() => {
    const payments = transactions.filter((transaction) => transaction.type === 'payment');
    const refunds = transactions.filter((transaction) => transaction.type === 'refund');

    const paymentAmount = payments.reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
    const refundAmount = refunds.reduce((total, transaction) => total + transaction.amount, 0);
    const netAmount = transactions.reduce((total, transaction) => total + transaction.amount, 0);

    return {
      totalTransactions: transactions.length,
      paymentAmount,
      refundAmount,
      netAmount,
    };
  }, [transactions]);

  const formatCurrency = (value: number) =>
    `฿${Math.abs(value).toLocaleString('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  const formatSignedCurrency = (value: number) => {
    if (value === 0) return '฿0';
    const formatted = formatCurrency(value);
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  };

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

  const netColorClass = stats.netAmount >= 0 ? 'text-success' : 'text-danger';

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={dashboardMenuItems}
        headerTitle="ประวัติการเงิน"
        headerSubtitle="ดูประวัติธุรกรรมและยอดคงเหลือ"
        roleLabel="ผู้ใช้ทั่วไป"
        roleColor="primary"
        userEmail={user?.email}
        showPartnerButton={true}
      >
        <div className="flex justify-center items-center py-20">
          <Loading centered size="xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={dashboardMenuItems}
      headerTitle="ประวัติการเงิน"
      headerSubtitle="ดูประวัติธุรกรรมและยอดคงเหลือ"
      roleLabel="ผู้ใช้ทั่วไป"
      roleColor="primary"
      userEmail={user?.email}
      showPartnerButton={true}
    >
      <section className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'ธุรกรรมทั้งหมด',
            value: stats.totalTransactions.toLocaleString('th-TH'),
            icon: BanknotesIcon,
            color: 'text-primary',
          },
          {
            label: 'ยอดชำระเงิน',
            value: stats.paymentAmount > 0 ? `-${formatCurrency(stats.paymentAmount)}` : '฿0',
            icon: MinusCircleIcon,
            color: 'text-danger',
          },
          {
            label: 'ยอดคืนเงิน',
            value: stats.refundAmount > 0 ? formatCurrency(stats.refundAmount) : '฿0',
            icon: PlusCircleIcon,
            color: 'text-success',
          },
          {
            label: 'ยอดสุทธิ',
            value: formatSignedCurrency(stats.netAmount),
            icon: ArrowTrendingUpIcon,
            color: netColorClass,
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-zinc-900 backdrop-blur-sm border-none ">
            <CardBody className="flex flex-row items-center justify-between border border-zinc-700 ">
              <div>
                <p className="text-sm text-default-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
              </div>
              <span className={color}>
                <Icon className="w-8 h-8" />
              </span>
            </CardBody>
          </Card>
        ))}
      </section>
      {/* Transactions Table */}
      <section>
        <Card className="backdrop-blur-sm border-none ">
          <CardBody className="p-0">
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="font-bold text-xl text-white">ประวัติธุรกรรม</h2>
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
              disableAnimation
              classNames={{
                base: "w-full",
                tabList:
                  "bg-zinc-900/60 border border-zinc-700  p-1 gap-1 overflow-x-auto !p-0.5",
                tab: "px-4 py-2 text-sm  text-default-400 transition-all data-[hover-unselected=true]:bg-zinc-800/60 data-[selected=true]:bg-red-600 data-[selected=true]:text-white",
                tabContent:
                  "font-normal group-data-[selected=true]:font-medium group-data-[selected=true]:text-white",
                cursor: "hidden",
              }}
            >
              <Tab key="all" title="ทั้งหมด" />
              <Tab key="payment" title="จ่ายเงิน" />
              <Tab key="topup" title="เติมเงิน" />
              <Tab key="refund" title="คืนเงิน" />
            </Tabs>

            <Table
              aria-label="Transactions table"
              classNames={{
                wrapper:
                  "bg-zinc-900/60 border border-zinc-700  gap-1 overflow-x-auto text-sm mt-4",
                thead: "bg-transparent",
                th: "bg-transparent text-white border-b border-zinc-700 p-0 font-medium",
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
              <TableBody emptyContent="ไม่พบข้อมูลธุรกรรม" className="text-white">
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-zinc-800/50">
                    <TableCell className="font-mono text-white">{transaction.id}</TableCell>
                    <TableCell className="text-default-400">
                      {new Date(transaction.date).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>{getTypeChip(transaction.type)}</TableCell>
                    <TableCell className="text-default-400">{transaction.description}</TableCell>
                    <TableCell
                      className={`font-mono font-bold ${
                        transaction.amount > 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {transaction.amount === 0
                        ? '฿0'
                        : `${transaction.amount > 0 ? '+' : '-'}${formatCurrency(transaction.amount)}`}
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
