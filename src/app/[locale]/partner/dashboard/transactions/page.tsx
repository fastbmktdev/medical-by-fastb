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
  CurrencyDollarIcon,
  Cog6ToothIcon,
  HomeIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';

function PartnerTransactionsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [gym, setGym] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Load gym first
        const { data: gymData } = await supabase
          .from('gyms')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setGym(gymData);
        
        // Load transactions (bookings with payment_status=paid)
        if (gymData) {
          await loadTransactions(gymData.id);
        }
      }
      
      setIsLoading(false);
    }
    loadUser();
  }, [supabase]);
  
  const loadTransactions = async (gymId: string) => {
    try {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('gym_id', gymId)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });
      
      if (bookingsData) {
        const mappedTransactions = bookingsData.map(b => ({
          id: b.booking_number,
          date: b.created_at,
          type: 'รายได้',
          description: `การจอง ${b.package_name} - ${b.customer_name}`,
          amount: Number(b.price_paid || 0),
          status: b.status === 'confirmed' || b.status === 'completed' ? 'completed' : 'pending',
        }));
        
        setTransactions(mappedTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const menuItems: MenuItem[] = [
    { label: 'ข้อมูลยิม', href: '/partner/dashboard/gym', icon: BuildingStorefrontIcon },
    { label: 'โปรโมชั่น', href: '/partner/dashboard/promotions', icon: MegaphoneIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'การจ่ายเงิน', href: '/partner/dashboard/payouts', icon: CurrencyDollarIcon },
    { label: 'สถิติ', href: '/partner/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่า', href: '/partner/dashboard/settings', icon: Cog6ToothIcon },
  ];
  
  // Calculate stats from real data
  const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0);
  const monthlyIncome = transactions
    .filter(t => {
      const txDate = new Date(t.date);
      const now = new Date();
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);

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
              <p className="font-mono font-bold text-3xl">฿{Number(totalBalance || 0).toLocaleString()}</p>
              <Button size="sm" className="bg-white/20 backdrop-blur-sm mt-4 text-white">
                ถอนเงิน
              </Button>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">รายได้เดือนนี้</p>
              <p className="font-mono font-bold text-success text-2xl">+฿{Number(monthlyIncome || 0).toLocaleString()}</p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">ถอนเงินแล้ว</p>
              <p className="font-mono font-bold text-warning text-2xl">฿0</p>
            </CardBody>
          </Card>
        </div>
      </section>

      <section>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-xl">ประวัติธุรกรรม</h2>
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
              <TableBody emptyContent="ยังไม่มีธุรกรรม">
                {transactions.map((txn) => (
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
                    <TableCell className="font-mono font-bold text-success">
                      +฿{Number(txn.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={txn.status === 'completed' ? 'success' : 'warning'}
                        variant="flat"
                        startContent={txn.status === 'completed' ? <CheckCircleIcon className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                      >
                        {txn.status === 'completed' ? 'สำเร็จ' : 'รอดำเนินการ'}
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
