"use client";

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@shared/lib/database/supabase/client';
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
import type { hospital, appointment } from '@shared/types/database.types';
import { Loading } from '@/components/design-system/primitives/Loading';

interface TransactionEntry {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  status: 'completed' | 'pending';
}

function PartnerTransactionsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [hospital, setHospital] = useState<hospital | null>(null);

  const loadTransactions = useCallback(
    async (hospitalId: string) => {
      try {
        const { data: bookingsData } = await supabase
          .from('appointments')
          .select('*')
          .eq('hospital_id', hospitalId)
          .eq('payment_status', 'paid')
          .order('created_at', { ascending: false });

        if (bookingsData) {
          const mappedTransactions: TransactionEntry[] = (bookingsData as appointment[]).map((b) => ({
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
    },
    [supabase]
  );

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Load hospital first
        const { data: hospitalData } = await supabase
          .from('hospitals')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setHospital(hospitalData);
        
        // Load transactions (appointments with payment_status=paid)
        if (hospitalData) {
          await loadTransactions(hospitalData.id);
        }
      }
      
      setIsLoading(false);
    }
    loadUser();
  }, [loadTransactions, supabase]);
  
  const menuItems: MenuItem[] = [
    { label: 'แดชบอร์ด', href: '/partner/dashboard', icon: HomeIcon },
    { label: 'ข้อมูลโรงพยาบาล', href: '/partner/dashboard/hospital', icon: BuildingStorefrontIcon },
    { label: 'โปรโมชั่น', href: '/partner/dashboard/promotions', icon: MegaphoneIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/appointments', icon: CalendarIcon },
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

  const headerSubtitle = hospital?.hospital_name
    ? `ดูประวัติธุรกรรมและรายได้สำหรับ ${hospital.hospital_name}`
    : 'ดูประวัติธุรกรรมและรายได้';

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="รายการธุรกรรม"
        headerSubtitle={headerSubtitle}
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <Loading centered size="xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle="รายการธุรกรรม"
      headerSubtitle={headerSubtitle}
      roleLabel="พาร์ทเนอร์"
      roleColor="secondary"
      userEmail={user?.email}
    >
      <section className="mb-8">
        <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
          <Card className="bg-linear-to-br from-success-500 to-success-700 border-none">
            <CardBody>
              {hospital?.hospital_name && (
                <p className="mb-1 text-zinc-950/60 text-xs uppercase tracking-wide">
                  {hospital.hospital_name}
                </p>
              )}
              <p className="mb-2 text-zinc-950/80 text-sm">ยอดคงเหลือ</p>
              <p className="font-mono font-semibold text-3xl">฿{Number(totalBalance || 0).toLocaleString()}</p>
              <Button size="sm" className="bg-white/20 backdrop-blur-sm mt-4 text-zinc-950">
                ถอนเงิน
              </Button>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">รายได้เดือนนี้</p>
              <p className="font-mono font-semibold text-success text-2xl">+฿{Number(monthlyIncome || 0).toLocaleString()}</p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">ถอนเงินแล้ว</p>
              <p className="font-mono font-semibold text-warning text-2xl">฿0</p>
              {hospital?.location && (
                <p className="mt-2 text-default-500 text-xs">
                  สถานที่: {hospital.location}
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </section>

      <section>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-xl">ประวัติธุรกรรม</h2>
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
                    <TableCell className="font-mono text-zinc-950">{txn.id}</TableCell>
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
                    <TableCell className="font-mono font-semibold text-success">
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
