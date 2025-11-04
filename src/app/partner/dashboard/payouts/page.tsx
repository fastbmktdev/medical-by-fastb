"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Select,
  SelectItem,
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
  PlusIcon,
  EyeIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import type { PartnerPayout } from '@/types/database.types';
import { CustomInput, CustomTextarea, CustomSelect } from '@/components/shared';
import Link from 'next/link';

interface PayoutStats {
  totalCompleted: number;
  totalPending: number;
  totalProcessing: number;
  totalAmount: number;
  pendingAmount: number;
}

function PartnerPayoutsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [gym, setGym] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payouts, setPayouts] = useState<PartnerPayout[]>([]);
  const [stats, setStats] = useState<PayoutStats>({
    totalCompleted: 0,
    totalPending: 0,
    totalProcessing: 0,
    totalAmount: 0,
    pendingAmount: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayout, setSelectedPayout] = useState<PartnerPayout | null>(null);
  
  // Request payout modal
  const { isOpen: isRequestOpen, onOpen: onRequestOpen, onClose: onRequestClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  
  const [requestForm, setRequestForm] = useState({
    period_start_date: '',
    period_end_date: '',
    payout_method: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_name: '',
    bank_branch: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: gymData } = await supabase
          .from('gyms')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setGym(gymData);
        
        if (gymData) {
          await loadPayouts();
        }
      }
      
      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const loadPayouts = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/partner/payouts?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setPayouts(result.data.payouts || []);
        
        // Calculate stats
        const completed = result.data.payouts.filter((p: PartnerPayout) => p.status === 'completed');
        const pending = result.data.payouts.filter((p: PartnerPayout) => p.status === 'pending');
        const processing = result.data.payouts.filter((p: PartnerPayout) => p.status === 'processing');
        
        setStats({
          totalCompleted: completed.length,
          totalPending: pending.length,
          totalProcessing: processing.length,
          totalAmount: completed.reduce((sum: number, p: PartnerPayout) => sum + Number(p.net_amount || 0), 0),
          pendingAmount: pending.reduce((sum: number, p: PartnerPayout) => sum + Number(p.net_amount || 0), 0),
        });
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (error) {
      console.error('Error loading payouts:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  useEffect(() => {
    if (gym) {
      loadPayouts();
    }
  }, [statusFilter, gym]);

  const handleRequestPayout = () => {
    setRequestForm({
      period_start_date: '',
      period_end_date: '',
      payout_method: '',
      bank_account_name: '',
      bank_account_number: '',
      bank_name: '',
      bank_branch: '',
      notes: '',
    });
    setFormErrors({});
    onRequestOpen();
  };

  const handleViewDetails = async (payout: PartnerPayout) => {
    try {
      const response = await fetch(`/api/partner/payouts/${payout.id}`);
      const result = await response.json();

      if (result.success) {
        setSelectedPayout(result.data);
        onDetailOpen();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาดในการโหลดรายละเอียด');
      }
    } catch (error) {
      console.error('Error loading payout details:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดรายละเอียด');
    }
  };

  const handleSubmitRequest = async () => {
    // Validation
    const errors: Record<string, string> = {};

    if (!requestForm.period_start_date) {
      errors.period_start_date = 'กรุณาระบุวันที่เริ่มต้น';
    }

    if (!requestForm.period_end_date) {
      errors.period_end_date = 'กรุณาระบุวันที่สิ้นสุด';
    }

    const startDate = requestForm.period_start_date ? new Date(requestForm.period_start_date) : null;
    const endDate = requestForm.period_end_date ? new Date(requestForm.period_end_date) : null;

    if (startDate && endDate && endDate < startDate) {
      errors.period_end_date = 'วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น';
    }

    if (requestForm.payout_method === 'bank_transfer') {
      if (!requestForm.bank_account_name?.trim()) {
        errors.bank_account_name = 'กรุณาระบุชื่อบัญชี';
      }
      if (!requestForm.bank_account_number?.trim()) {
        errors.bank_account_number = 'กรุณาระบุเลขที่บัญชี';
      }
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('กรุณากรอกข้อมูลให้ถูกต้อง');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/partner/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start_date: startDate!.toISOString().split('T')[0],
          period_end_date: endDate!.toISOString().split('T')[0],
          payout_method: requestForm.payout_method || null,
          bank_account_name: requestForm.bank_account_name?.trim() || null,
          bank_account_number: requestForm.bank_account_number?.trim() || null,
          bank_name: requestForm.bank_name?.trim() || null,
          bank_branch: requestForm.bank_branch?.trim() || null,
          notes: requestForm.notes?.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('ส่งคำขอจ่ายเงินสำเร็จ');
        onRequestClose();
        setRequestForm({
          period_start_date: '',
          period_end_date: '',
          payout_method: '',
          bank_account_name: '',
          bank_account_number: '',
          bank_name: '',
          bank_branch: '',
          notes: '',
        });
        loadPayouts();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาดในการส่งคำขอ');
        if (result.errors) {
          setFormErrors(result.errors);
        }
      }
    } catch (error) {
      console.error('Error submitting payout request:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งคำขอ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { label: string; color: 'success' | 'warning' | 'danger' | 'default' }> = {
      pending: { label: 'รอดำเนินการ', color: 'warning' },
      processing: { label: 'กำลังดำเนินการ', color: 'default' },
      completed: { label: 'เสร็จสิ้น', color: 'success' },
      failed: { label: 'ล้มเหลว', color: 'danger' },
      cancelled: { label: 'ยกเลิก', color: 'default' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Chip color={config.color} variant="flat" size="sm">
        {config.label}
      </Chip>
    );
  };

  const getPayoutMethodLabel = (method: string | null | undefined) => {
    const methods: Record<string, string> = {
      bank_transfer: 'โอนเงินผ่านธนาคาร',
      promptpay: 'พร้อมเพย์',
      truewallet: 'ทรูวอลเล็ต',
      paypal: 'PayPal',
      other: 'อื่นๆ',
    };
    return methods[method || ''] || '-';
  };

  const menuItems: MenuItem[] = [
    { label: 'Dashboard', href: '/partner/dashboard', icon: HomeIcon },
    { label: 'รายการจอง', href: '/partner/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'การจ่ายเงิน', href: '/partner/dashboard/payouts', icon: CurrencyDollarIcon },
    { label: 'สถิติ', href: '/partner/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่า', href: '/partner/dashboard/settings', icon: Cog6ToothIcon },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="การจ่ายเงิน"
        headerSubtitle="จัดการการจ่ายเงินและดูประวัติ"
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

  if (!gym) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="การจ่ายเงิน"
        headerSubtitle="จัดการการจ่ายเงินและดูประวัติ"
        roleLabel="พาร์ทเนอร์"
        roleColor="secondary"
        userEmail={user?.email}
      >
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody className="py-16 text-center">
            <BuildingStorefrontIcon className="mx-auto mb-6 w-20 h-20 text-default-300" />
            <h2 className="mb-4 font-bold text-2xl">ยังไม่มีข้อมูลยิม</h2>
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      menuItems={menuItems}
      headerTitle="การจ่ายเงิน"
      headerSubtitle="จัดการการจ่ายเงินและดูประวัติ"
      roleLabel="พาร์ทเนอร์"
      roleColor="secondary"
      userEmail={user?.email}
    >
      <Toaster />
      
      {/* Stats Cards */}
      <section className="mb-8">
        <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-success-500 to-success-700 border-none">
            <CardBody>
              <p className="mb-2 text-white/80 text-sm">จ่ายเงินสำเร็จ</p>
              <p className="font-bold text-white text-2xl">{stats.totalCompleted}</p>
              <p className="font-mono text-white/90 text-sm">฿{stats.totalAmount.toLocaleString()}</p>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-warning-500 to-warning-600 border-none">
            <CardBody>
              <p className="mb-2 text-white/80 text-sm">รอดำเนินการ</p>
              <p className="font-bold text-white text-2xl">{stats.totalPending}</p>
              <p className="font-mono text-white/90 text-sm">฿{stats.pendingAmount.toLocaleString()}</p>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-default-500 to-default-600 border-none">
            <CardBody>
              <p className="mb-2 text-white/80 text-sm">กำลังดำเนินการ</p>
              <p className="font-bold text-white text-2xl">{stats.totalProcessing}</p>
            </CardBody>
          </Card>
          <Card className="bg-default-100/50 backdrop-blur-sm border-none">
            <CardBody>
              <p className="mb-2 text-default-400 text-sm">ยอดรวมทั้งหมด</p>
              <p className="font-mono font-bold text-success text-2xl">
                ฿{(stats.totalAmount + stats.pendingAmount).toLocaleString()}
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Actions */}
      <section className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <Select
              label="กรองตามสถานะ"
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              className="w-48"
              size="sm"
            >
              <SelectItem key="all">ทั้งหมด</SelectItem>
              <SelectItem key="pending">รอดำเนินการ</SelectItem>
              <SelectItem key="processing">กำลังดำเนินการ</SelectItem>
              <SelectItem key="completed">เสร็จสิ้น</SelectItem>
              <SelectItem key="failed">ล้มเหลว</SelectItem>
              <SelectItem key="cancelled">ยกเลิก</SelectItem>
            </Select>
          </div>
          <Button
            color="secondary"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={handleRequestPayout}
          >
            ขอจ่ายเงิน
          </Button>
        </div>
      </section>

      {/* Payouts Table */}
      <section>
        <Card className="bg-default-100/50 backdrop-blur-sm border-none">
          <CardBody>
            <Table
              aria-label="Payouts table"
              classNames={{
                wrapper: "bg-transparent",
              }}
            >
              <TableHeader>
                <TableColumn>รหัสการจ่ายเงิน</TableColumn>
                <TableColumn>ช่วงเวลา</TableColumn>
                <TableColumn>รายได้รวม</TableColumn>
                <TableColumn>ค่าคอมมิชชั่น</TableColumn>
                <TableColumn>ยอดจ่ายสุทธิ</TableColumn>
                <TableColumn>วิธีการจ่าย</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>วันที่ขอ</TableColumn>
                <TableColumn>การจัดการ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ยังไม่มีการจ่ายเงิน">
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-mono text-white">{payout.payout_number}</TableCell>
                    <TableCell className="text-default-400">
                      {new Date(payout.period_start_date).toLocaleDateString('th-TH')} - {new Date(payout.period_end_date).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell className="font-mono text-white">
                      ฿{Number(payout.total_revenue || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-default-400">
                      {payout.commission_rate}% (฿{Number(payout.platform_fee || 0).toLocaleString()})
                    </TableCell>
                    <TableCell className="font-mono font-bold text-success">
                      ฿{Number(payout.net_amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-default-400">
                      {getPayoutMethodLabel(payout.payout_method)}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(payout.status)}
                    </TableCell>
                    <TableCell className="text-default-400">
                      {new Date(payout.requested_at).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="flat"
                        color="secondary"
                        isIconOnly
                        onPress={() => handleViewDetails(payout)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </section>

      {/* Request Payout Modal */}
      <Modal
        isOpen={isRequestOpen}
        onClose={onRequestClose}
        size="2xl"
        scrollBehavior="inside"
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          wrapper: "z-[100]",
        }}
      >
        <ModalContent className="bg-zinc-950 border border-zinc-700">
          <ModalHeader className="text-white">ขอจ่ายเงิน</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="gap-4 grid grid-cols-2">
                <CustomInput
                  id="period_start_date"
                  name="period_start_date"
                  label="วันที่เริ่มต้น"
                  type="date"
                  value={requestForm.period_start_date}
                  onChange={(value) => setRequestForm({ ...requestForm, period_start_date: String(value) })}
                  required
                  error={formErrors.period_start_date}
                />
                <CustomInput
                  id="period_end_date"
                  name="period_end_date"
                  label="วันที่สิ้นสุด"
                  type="date"
                  value={requestForm.period_end_date}
                  onChange={(value) => setRequestForm({ ...requestForm, period_end_date: String(value) })}
                  required
                  error={formErrors.period_end_date}
                />
              </div>

              <CustomSelect
                id="payout_method"
                name="payout_method"
                label="วิธีการจ่ายเงิน"
                value={requestForm.payout_method}
                onChange={(value) => setRequestForm({ ...requestForm, payout_method: String(value) })}
              >
                <option value="">เลือกวิธีการจ่ายเงิน</option>
                <option value="bank_transfer">โอนเงินผ่านธนาคาร</option>
                <option value="promptpay">พร้อมเพย์</option>
                <option value="truewallet">ทรูวอลเล็ต</option>
                <option value="paypal">PayPal</option>
                <option value="other">อื่นๆ</option>
              </CustomSelect>

              {requestForm.payout_method === 'bank_transfer' && (
                <>
                  <CustomInput
                    id="bank_account_name"
                    name="bank_account_name"
                    label="ชื่อบัญชี"
                    value={requestForm.bank_account_name}
                    onChange={(value) => setRequestForm({ ...requestForm, bank_account_name: String(value) })}
                    required
                    error={formErrors.bank_account_name}
                  />
                  <CustomInput
                    id="bank_account_number"
                    name="bank_account_number"
                    label="เลขที่บัญชี"
                    value={requestForm.bank_account_number}
                    onChange={(value) => setRequestForm({ ...requestForm, bank_account_number: String(value) })}
                    required
                    error={formErrors.bank_account_number}
                  />
                  <CustomInput
                    id="bank_name"
                    name="bank_name"
                    label="ชื่อธนาคาร"
                    value={requestForm.bank_name}
                    onChange={(value) => setRequestForm({ ...requestForm, bank_name: String(value) })}
                  />
                  <CustomInput
                    id="bank_branch"
                    name="bank_branch"
                    label="สาขา"
                    value={requestForm.bank_branch}
                    onChange={(value) => setRequestForm({ ...requestForm, bank_branch: String(value) })}
                  />
                </>
              )}

              <CustomTextarea
                id="notes"
                name="notes"
                label="หมายเหตุ"
                value={requestForm.notes}
                onChange={(value) => setRequestForm({ ...requestForm, notes: String(value) })}
                rows={3}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onRequestClose}>
              ยกเลิก
            </Button>
            <Button
              color="secondary"
              onPress={handleSubmitRequest}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
            >
              ส่งคำขอ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Payout Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={onDetailClose}
        size="3xl"
        scrollBehavior="inside"
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          wrapper: "z-[100]",
        }}
      >
        <ModalContent className="bg-zinc-950 border border-zinc-700">
          <ModalHeader className="text-white">รายละเอียดการจ่ายเงิน</ModalHeader>
          <ModalBody>
            {selectedPayout && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="gap-4 grid grid-cols-2">
                  <div>
                    <p className="mb-1 text-zinc-400 text-sm">รหัสการจ่ายเงิน</p>
                    <p className="font-mono font-bold text-white">{selectedPayout.payout_number}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-zinc-400 text-sm">สถานะ</p>
                    {getStatusChip(selectedPayout.status)}
                  </div>
                </div>

                {/* Period */}
                <div>
                  <p className="mb-1 text-zinc-400 text-sm">ช่วงเวลา</p>
                  <p className="text-white">
                    {new Date(selectedPayout.period_start_date).toLocaleDateString('th-TH')} - {new Date(selectedPayout.period_end_date).toLocaleDateString('th-TH')}
                  </p>
                </div>

                {/* Amount Breakdown */}
                <div className="bg-zinc-800/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">รายได้รวม</span>
                    <span className="font-mono font-bold text-white">฿{Number(selectedPayout.total_revenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">ค่าคอมมิชชั่น ({selectedPayout.commission_rate}%)</span>
                    <span className="font-mono text-zinc-400">-฿{Number(selectedPayout.platform_fee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-700">
                    <span className="font-semibold text-white">ยอดจ่ายสุทธิ</span>
                    <span className="font-mono font-bold text-success text-xl">฿{Number(selectedPayout.net_amount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment Info */}
                {selectedPayout.payout_method && (
                  <div>
                    <p className="mb-2 text-zinc-400 text-sm">ข้อมูลการจ่ายเงิน</p>
                    <div className="bg-zinc-800/50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">วิธีการจ่าย</span>
                        <span className="text-white">{getPayoutMethodLabel(selectedPayout.payout_method)}</span>
                      </div>
                      {selectedPayout.bank_account_name && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">ชื่อบัญชี</span>
                          <span className="text-white">{selectedPayout.bank_account_name}</span>
                        </div>
                      )}
                      {selectedPayout.bank_account_number && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">เลขที่บัญชี</span>
                          <span className="font-mono text-white">{selectedPayout.bank_account_number}</span>
                        </div>
                      )}
                      {selectedPayout.bank_name && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">ธนาคาร</span>
                          <span className="text-white">{selectedPayout.bank_name}</span>
                        </div>
                      )}
                      {selectedPayout.transaction_id && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">รหัสอ้างอิง</span>
                          <span className="font-mono text-white">{selectedPayout.transaction_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="gap-4 grid grid-cols-3">
                  <div>
                    <p className="mb-1 text-zinc-400 text-sm">วันที่ขอ</p>
                    <p className="text-white text-sm">{new Date(selectedPayout.requested_at).toLocaleString('th-TH')}</p>
                  </div>
                  {selectedPayout.processed_at && (
                    <div>
                      <p className="mb-1 text-zinc-400 text-sm">วันที่ดำเนินการ</p>
                      <p className="text-white text-sm">{new Date(selectedPayout.processed_at).toLocaleString('th-TH')}</p>
                    </div>
                  )}
                  {selectedPayout.completed_at && (
                    <div>
                      <p className="mb-1 text-zinc-400 text-sm">วันที่เสร็จสิ้น</p>
                      <p className="text-white text-sm">{new Date(selectedPayout.completed_at).toLocaleString('th-TH')}</p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedPayout.notes && (
                  <div>
                    <p className="mb-1 text-zinc-400 text-sm">หมายเหตุ</p>
                    <p className="text-white">{selectedPayout.notes}</p>
                  </div>
                )}

                {/* Related Bookings Count */}
                {selectedPayout.related_booking_ids && selectedPayout.related_booking_ids.length > 0 && (
                  <div>
                    <p className="mb-1 text-zinc-400 text-sm">จำนวนการจองที่รวม</p>
                    <p className="text-white">{selectedPayout.related_booking_ids.length} รายการ</p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onDetailClose}>
              ปิด
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
}

export default function PartnerPayoutsPage() {
  return (
    <RoleGuard allowedRole="partner">
      <PartnerPayoutsContent />
    </RoleGuard>
  );
}

