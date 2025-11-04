"use client";

import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Input, Tabs, Tab, useDisclosure, Switch, Spinner } from '@heroui/react';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MegaphoneIcon,
  ClockIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import PromotionCreateModal from '@/components/features/partner/promotion-management/PromotionCreateModal';
import PromotionEditModal from '@/components/features/partner/promotion-management/PromotionEditModal';
import PromotionDeleteDialog from '@/components/features/partner/promotion-management/PromotionDeleteDialog';

interface Promotion {
  id: string;
  title: string;
  title_english?: string | null;
  description?: string | null;
  is_active: boolean;
  priority: number;
  show_in_marquee: boolean;
  start_date?: string | null;
  end_date?: string | null;
  link_url?: string | null;
  link_text?: string | null;
  gym_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

function PartnerPromotionsContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const createModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteDialog = useDisclosure();

  const menuItems: MenuItem[] = [
    { label: 'แดชบอร์ด', href: '/partner/dashboard', icon: HomeIcon },
    { label: 'ข้อมูลยิม', href: '/partner/dashboard/gym', icon: BuildingStorefrontIcon },
    { label: 'โปรโมชั่น', href: '/partner/dashboard/promotions', icon: MegaphoneIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/bookings', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'การจ่ายเงิน', href: '/partner/dashboard/payouts', icon: CurrencyDollarIcon },
    { label: 'สถิติ', href: '/partner/dashboard/analytics', icon: ChartBarIcon },
    { label: 'ตั้งค่า', href: '/partner/dashboard/settings', icon: Cog6ToothIcon },
  ];

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    loadUser();
    loadPromotions();
  }, [supabase]);

  useEffect(() => {
    filterPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promotions, searchQuery, selectedTab]);

  async function loadPromotions() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/partner/promotions');
      const result = await response.json();

      if (result.success && result.data) {
        setPromotions(result.data);
      } else {
        toast.error(result.error || 'โหลดโปรโมชั่นไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  }

  function filterPromotions() {
    let filtered = promotions;

    // Filter by tab
    if (selectedTab === 'active') {
      filtered = filtered.filter(p => p.is_active);
    } else if (selectedTab === 'inactive') {
      filtered = filtered.filter(p => !p.is_active);
    } else if (selectedTab === 'marquee') {
      filtered = filtered.filter(p => p.show_in_marquee && p.is_active);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.title?.toLowerCase().includes(query) ||
          p.title_english?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    setFilteredPromotions(filtered);
  }

  const handleDelete = async () => {
    if (selectedPromotion) {
      await loadPromotions();
      deleteDialog.onClose();
      setSelectedPromotion(null);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    editModal.onOpen();
  };

  const handleDeleteClick = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    deleteDialog.onOpen();
  };

  const handleToggleActive = async (promotion: Promotion, isActive: boolean) => {
    try {
      const response = await fetch(`/api/partner/promotions/${promotion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`โปรโมชั่น${isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}แล้ว`);
        await loadPromotions();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error toggling promotion:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="จัดการโปรโมชั่น"
        headerSubtitle="สร้างและจัดการโปรโมชั่นสำหรับค่ายมวยของคุณ"
        roleLabel="พาร์ทเนอร์"
        roleColor="primary"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="จัดการโปรโมชั่น"
        headerSubtitle="สร้างและจัดการโปรโมชั่นสำหรับค่ายมวยของคุณ"
        roleLabel="พาร์ทเนอร์"
        roleColor="primary"
        userEmail={user?.email}
      >
        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="ค้นหาโปรโมชั่น..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                  variant="bordered"
                />
              </div>
              <Button
                color="primary"
                startContent={<PlusIcon className="w-5 h-5" />}
                onPress={createModal.onOpen}
              >
                สร้างโปรโมชั่นใหม่
              </Button>
            </div>

            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              variant="underlined"
              classNames={{
                tabList: 'gap-6 w-full relative rounded-none p-0 border-b border-divider',
                cursor: 'w-full bg-primary',
                tab: 'max-w-fit px-0 h-12',
                tabContent: 'group-data-[selected=true]:text-primary',
              }}
            >
              <Tab key="all" title={`ทั้งหมด (${promotions.length})`} />
              <Tab key="active" title={`เปิดใช้งาน (${promotions.filter(p => p.is_active).length})`} />
              <Tab key="inactive" title={`ปิดใช้งาน (${promotions.filter(p => !p.is_active).length})`} />
              <Tab key="marquee" title={`แสดงใน Marquee (${promotions.filter(p => p.show_in_marquee && p.is_active).length})`} />
            </Tabs>

            <Table aria-label="Promotions table" className="mt-4">
              <TableHeader>
                <TableColumn>ชื่อโปรโมชั่น</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>วันที่เริ่มต้น</TableColumn>
                <TableColumn>วันที่สิ้นสุด</TableColumn>
                <TableColumn>Priority</TableColumn>
                <TableColumn>แสดงใน Marquee</TableColumn>
                <TableColumn>จัดการ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่มีโปรโมชั่น">
                {filteredPromotions.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{promotion.title}</div>
                        {promotion.title_english && (
                          <div className="text-sm text-default-500">{promotion.title_english}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          size="sm"
                          isSelected={promotion.is_active}
                          onValueChange={(isActive) => handleToggleActive(promotion, isActive)}
                        />
                        <Chip
                          color={promotion.is_active ? 'success' : 'default'}
                          variant="flat"
                          size="sm"
                        >
                          {promotion.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </Chip>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <ClockIcon className="w-4 h-4 text-default-400" />
                        {formatDate(promotion.start_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <ClockIcon className="w-4 h-4 text-default-400" />
                        {formatDate(promotion.end_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip variant="flat" size="sm">
                        {promotion.priority}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={promotion.show_in_marquee ? 'primary' : 'default'}
                        variant="flat"
                        size="sm"
                      >
                        {promotion.show_in_marquee ? 'แสดง' : 'ไม่แสดง'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onPress={() => handleEdit(promotion)}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          onPress={() => handleDeleteClick(promotion)}
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
      </DashboardLayout>

      {/* Modals */}
      <PromotionCreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        onSuccess={loadPromotions}
      />
      {selectedPromotion && (
        <>
          <PromotionEditModal
            isOpen={editModal.isOpen}
            onClose={editModal.onClose}
            onSuccess={loadPromotions}
            promotion={selectedPromotion}
          />
          <PromotionDeleteDialog
            isOpen={deleteDialog.isOpen}
            onClose={deleteDialog.onClose}
            onConfirm={handleDelete}
            promotion={selectedPromotion}
          />
        </>
      )}
    </>
  );
}

export default function PartnerPromotionsPage() {
  return (
    <RoleGuard allowedRole="partner">
      <PartnerPromotionsContent />
    </RoleGuard>
  );
}
