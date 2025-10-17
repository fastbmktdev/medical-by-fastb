"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RoleGuard from '@/components/auth/RoleGuard';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Avatar,
  Chip,
  Divider,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Textarea,
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
  ClockIcon,
  BanknotesIcon,
  DocumentTextIcon,
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
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    gym_name: '',
    contact_name: '',
    phone: '',
    email: '',
    location: '',
    gym_details: '',
  });

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
        if (gymData) {
          setEditFormData({
            gym_name: gymData.gym_name || '',
            contact_name: gymData.contact_name || '',
            phone: gymData.phone || '',
            email: gymData.email || '',
            location: gymData.location || '',
            gym_details: gymData.gym_details || '',
          });
        }
      }

      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const handleSaveProfile = async () => {
    if (!gym) return;

    try {
      const { error } = await supabase
        .from('gyms')
        .update(editFormData)
        .eq('id', gym.id);

      if (error) throw error;

      // Reload gym data
      const { data: updatedGym } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', gym.id)
        .single();

      setGym(updatedGym);
      setIsEditing(false);
      alert('บันทึกข้อมูลสำเร็จ!');
    } catch (error) {
      console.error('Error updating gym:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

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

  // Mock booking data
  const mockBookings = [
    {
      id: '1',
      customer: 'สมชาย ใจดี',
      service: 'มวยไทย - Private Class',
      date: '2024-10-20',
      time: '10:00-11:00',
      status: 'confirmed',
      amount: '฿500',
    },
    {
      id: '2',
      customer: 'สมหญิง รักสุข',
      service: 'คลาสกลุ่ม',
      date: '2024-10-21',
      time: '14:00-15:00',
      status: 'pending',
      amount: '฿300',
    },
  ];

  // Mock transaction data
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
    {
      id: 'TXN003',
      date: '2024-10-18',
      type: 'รายได้',
      description: 'การจอง คลาสกลุ่ม - สมหญิง รักสุข',
      amount: '+฿300',
      status: 'pending',
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
                {gym?.gym_name || 'แดชบอร์ดพาร์ทเนอร์'}
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
              {gym && (
                <Button
                  as={Link}
                  href={`/gyms/${gym.id}`}
                  variant="bordered"
                  startContent={<EyeIcon className="w-5 h-5" />}
                  className="font-semibold"
                >
                  ดูหน้ายิม
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
                          {stat.change !== '-' && (
                            <Chip
                              size="sm"
                              color="success"
                              variant="flat"
                              startContent={<ArrowTrendingUpIcon className="w-3 h-3" />}
                            >
                              {stat.change}
                            </Chip>
                          )}
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

            {/* Tabs Section */}
            <section>
              <Tabs
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as string)}
                variant="underlined"
                classNames={{
                  tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                  cursor: "w-full bg-secondary",
                  tab: "max-w-fit px-0 h-12",
                  tabContent: "group-data-[selected=true]:text-secondary"
                }}
              >
                {/* Tab 1: ข้อมูลยิม */}
                <Tab
                  key="overview"
                  title={
                    <div className="flex items-center gap-2">
                      <BuildingStorefrontIcon className="w-5 h-5" />
                      <span>ข้อมูลยิม</span>
                    </div>
                  }
                >
                  <Card className="bg-default-100/50 backdrop-blur-sm mt-6 border-none">
                    <CardHeader className="flex justify-between items-center">
                      <h3 className="font-bold text-white text-xl">ข้อมูลยิม</h3>
                      {!isEditing ? (
                        <Button
                          size="sm"
                          color="secondary"
                          variant="flat"
                          startContent={<PencilIcon className="w-4 h-4" />}
                          onPress={() => setIsEditing(true)}
                        >
                          แก้ไข
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => setIsEditing(false)}
                          >
                            ยกเลิก
                          </Button>
                          <Button
                            size="sm"
                            color="secondary"
                            onPress={handleSaveProfile}
                          >
                            บันทึก
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardBody className="gap-6">
                      {isEditing ? (
                        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                          <Input
                            label="ชื่อยิม"
                            value={editFormData.gym_name}
                            onValueChange={(value) => setEditFormData({ ...editFormData, gym_name: value })}
                          />
                          <Input
                            label="ผู้ติดต่อ"
                            value={editFormData.contact_name}
                            onValueChange={(value) => setEditFormData({ ...editFormData, contact_name: value })}
                          />
                          <Input
                            label="โทรศัพท์"
                            value={editFormData.phone}
                            onValueChange={(value) => setEditFormData({ ...editFormData, phone: value })}
                          />
                          <Input
                            label="อีเมล"
                            type="email"
                            value={editFormData.email}
                            onValueChange={(value) => setEditFormData({ ...editFormData, email: value })}
                          />
                          <Textarea
                            label="ที่อยู่"
                            value={editFormData.location}
                            onValueChange={(value) => setEditFormData({ ...editFormData, location: value })}
                            className="md:col-span-2"
                          />
                          <Textarea
                            label="รายละเอียดยิม"
                            value={editFormData.gym_details || ''}
                            onValueChange={(value) => setEditFormData({ ...editFormData, gym_details: value })}
                            className="md:col-span-2"
                          />
                        </div>
                      ) : (
                        <div className="gap-8 grid grid-cols-1 lg:grid-cols-2">
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
                      )}

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
                </Tab>

                {/* Tab 2: ประวัติการจอง */}
                <Tab
                  key="bookings"
                  title={
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5" />
                      <span>ประวัติการจอง</span>
                    </div>
                  }
                >
                  <Card className="bg-default-100/50 backdrop-blur-sm mt-6 border-none">
                    <CardBody>
                      <Table
                        aria-label="Booking history table"
                        classNames={{
                          wrapper: "bg-transparent",
                        }}
                      >
                        <TableHeader>
                          <TableColumn>ลูกค้า</TableColumn>
                          <TableColumn>บริการ</TableColumn>
                          <TableColumn>วันที่</TableColumn>
                          <TableColumn>เวลา</TableColumn>
                          <TableColumn>สถานะ</TableColumn>
                          <TableColumn>ยอดเงิน</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {mockBookings.map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell className="text-white">{booking.customer}</TableCell>
                              <TableCell className="text-default-400">{booking.service}</TableCell>
                              <TableCell className="text-default-400">{new Date(booking.date).toLocaleDateString('th-TH')}</TableCell>
                              <TableCell className="text-default-400">{booking.time}</TableCell>
                              <TableCell>
                                <Chip
                                  size="sm"
                                  color={booking.status === 'confirmed' ? 'success' : 'warning'}
                                  variant="flat"
                                >
                                  {booking.status === 'confirmed' ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
                                </Chip>
                              </TableCell>
                              <TableCell className="font-mono text-white">{booking.amount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardBody>
                  </Card>
                </Tab>

                {/* Tab 3: Transactions */}
                <Tab
                  key="transactions"
                  title={
                    <div className="flex items-center gap-2">
                      <BanknotesIcon className="w-5 h-5" />
                      <span>รายการธุรกรรม</span>
                    </div>
                  }
                >
                  <Card className="bg-default-100/50 backdrop-blur-sm mt-6 border-none">
                    <CardHeader className="flex justify-between items-center">
                      <h3 className="font-bold text-white text-xl">ประวัติธุรกรรม</h3>
                      <Button
                        size="sm"
                        color="secondary"
                        variant="flat"
                        startContent={<DocumentTextIcon className="w-4 h-4" />}
                      >
                        ดาวน์โหลดรายงาน
                      </Button>
                    </CardHeader>
                    <CardBody>
                      <Table
                        aria-label="Transaction history table"
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
                              <TableCell className="text-default-400">{new Date(txn.date).toLocaleDateString('th-TH')}</TableCell>
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
                </Tab>
              </Tabs>
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
