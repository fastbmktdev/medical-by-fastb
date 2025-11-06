"use client";

import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Input, Tabs, Tab, useDisclosure, Switch } from '@heroui/react';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MegaphoneIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import PromotionCreateModal from '@/components/features/admin/promotion-management/PromotionCreateModal';
import PromotionEditModal from '@/components/features/admin/promotion-management/PromotionEditModal';
import PromotionDeleteDialog from '@/components/features/admin/promotion-management/PromotionDeleteDialog';

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
  coupon_code?: string | null;
  discount_type?: 'percentage' | 'fixed_amount' | null;
  discount_value?: number | null;
  min_purchase_amount?: number | null;
  max_discount_amount?: number | null;
  max_uses?: number | null;
  current_uses?: number | null;
  created_at?: string;
  updated_at?: string;
}

function AdminPromotionsContent() {
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
      const response = await fetch('/api/admin/promotions');
      const result = await response.json();

      if (result.success && result.data) {
        setPromotions(result.data);
      } else {
        toast.error('โหลดโปรโมชั่นไม่สำเร็จ');
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
      const response = await fetch(`/api/admin/promotions/${promotion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(isActive ? 'เปิดใช้งานโปรโมชั่นสำเร็จ' : 'ปิดใช้งานโปรโมชั่นสำเร็จ');
        loadPromotions();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error toggling promotion:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const stats = {
    total: promotions.length,
    active: promotions.filter(p => p.is_active).length,
    inactive: promotions.filter(p => !p.is_active).length,
    marquee: promotions.filter(p => p.show_in_marquee && p.is_active).length,
  };

  const isExpired = (promotion: Promotion) => {
    if (!promotion.end_date) return false;
    return new Date(promotion.end_date) < new Date();
  };

  const isUpcoming = (promotion: Promotion) => {
    if (!promotion.start_date) return false;
    return new Date(promotion.start_date) > new Date();
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการโปรโมชั่น"
        headerSubtitle="จัดการโปรโมชั่นทั้งหมดในระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-12">
          <div className="text-white">กำลังโหลด...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการโปรโมชั่น"
        headerSubtitle="จัดการโปรโมชั่นทั้งหมดในระบบ"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <Toaster position="top-right" />

        {/* Stats Cards */}
        <div className="gap-4 grid grid-cols-1 md:grid-cols-4 mb-6">
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">โปรโมชั่นทั้งหมด</p>
                  <p className="font-bold text-2xl">{stats.total}</p>
                </div>
                <MegaphoneIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">กำลังใช้งาน</p>
                  <p className="font-bold text-2xl text-green-500">{stats.active}</p>
                </div>
                <MegaphoneIcon className="w-8 h-8 text-green-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">ปิดใช้งาน</p>
                  <p className="font-bold text-2xl text-red-500">{stats.inactive}</p>
                </div>
                <MegaphoneIcon className="w-8 h-8 text-red-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">แสดงใน Marquee</p>
                  <p className="font-bold text-2xl text-yellow-500">{stats.marquee}</p>
                </div>
                <ClockIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Actions Bar */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <Input
                placeholder="ค้นหาโปรโมชั่น..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<MagnifyingGlassIcon className="w-5 h-5 text-zinc-400" />}
                className="max-w-sm"
              />
              <Button
                color="primary"
                onPress={createModal.onOpen}
                startContent={<PlusIcon className="w-5 h-5" />}
              >
                สร้างโปรโมชั่นใหม่
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Tabs */}
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
          className="mb-6"
        >
          <Tab key="all" title="ทั้งหมด" />
          <Tab key="active" title="กำลังใช้งาน" />
          <Tab key="inactive" title="ปิดใช้งาน" />
          <Tab key="marquee" title="แสดงใน Marquee" />
        </Tabs>

        {/* Table */}
        <Card>
          <CardBody>
            <Table aria-label="Promotions table" removeWrapper>
              <TableHeader>
                <TableColumn>ชื่อโปรโมชั่น</TableColumn>
                <TableColumn>ความสำคัญ</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>วันที่เริ่ม/สิ้นสุด</TableColumn>
                <TableColumn>แสดงใน Marquee</TableColumn>
                <TableColumn>การจัดการ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบโปรโมชั่น">
                {filteredPromotions.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{promotion.title}</p>
                        {promotion.title_english && (
                          <p className="text-sm text-zinc-400">{promotion.title_english}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {promotion.priority}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Switch
                          size="sm"
                          isSelected={promotion.is_active}
                          onValueChange={(checked) => handleToggleActive(promotion, checked)}
                        />
                        {isExpired(promotion) && (
                          <Chip size="sm" color="warning" variant="flat">
                            หมดอายุ
                          </Chip>
                        )}
                        {isUpcoming(promotion) && (
                          <Chip size="sm" color="primary" variant="flat">
                            กำลังจะเริ่ม
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {promotion.start_date && (
                          <p>เริ่ม: {new Date(promotion.start_date).toLocaleDateString('th-TH')}</p>
                        )}
                        {promotion.end_date && (
                          <p>สิ้นสุด: {new Date(promotion.end_date).toLocaleDateString('th-TH')}</p>
                        )}
                        {!promotion.start_date && !promotion.end_date && (
                          <p className="text-zinc-400">ไม่มีกำหนด</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={promotion.show_in_marquee ? 'success' : 'default'}
                        variant="flat"
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

export default function AdminPromotionsPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminPromotionsContent />
    </RoleGuard>
  );
}
