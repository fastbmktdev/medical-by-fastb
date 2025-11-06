"use client";

import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Input, Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, useDisclosure } from '@heroui/react';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  FlagIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';

interface ContentFlag {
  id: string;
  content_type: string;
  content_id: string;
  flag_type: string;
  reason?: string | null;
  status: string;
  moderation_notes?: string | null;
  reported_by?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  reported_by_user?: { id: string; email: string } | null;
  reviewed_by_user?: { id: string; email: string } | null;
}

function AdminModerationContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [filteredFlags, setFilteredFlags] = useState<ContentFlag[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<ContentFlag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);

  const detailModal = useDisclosure();
  const actionModal = useDisclosure();
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    loadUser();
  }, [supabase]);

  useEffect(() => {
    loadFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  useEffect(() => {
    filterFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flags, searchQuery, selectedTab]);

  async function loadFlags() {
    try {
      setIsLoading(true);
      const status = selectedTab === 'all' ? undefined : selectedTab;
      const url = status ? `/api/admin/moderation/flags?status=${status}` : '/api/admin/moderation/flags';
      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data) {
        setFlags(result.data);
      } else {
        toast.error('โหลดรายการแจ้งเตือนไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Error loading flags:', error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  }

  function filterFlags() {
    let filtered = flags;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        flag =>
          flag.content_type.toLowerCase().includes(query) ||
          flag.flag_type.toLowerCase().includes(query) ||
          flag.reason?.toLowerCase().includes(query) ||
          flag.reported_by_user?.email?.toLowerCase().includes(query)
      );
    }

    setFilteredFlags(filtered);
  }

  async function handleUpdateFlagStatus(flagId: string, status: string, notes?: string) {
    try {
      const response = await fetch(`/api/admin/moderation/flags/${flagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, moderationNotes: notes }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('อัปเดตสถานะสำเร็จ');
        loadFlags();
        detailModal.onClose();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error updating flag status:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  }

  async function handleModerationAction(action: 'approve' | 'reject' | 'delete') {
    if (!selectedFlag) return;

    try {
      const response = await fetch('/api/admin/moderation/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: selectedFlag.content_type,
          contentId: selectedFlag.content_id,
          action,
          actionReason: actionReason,
          flagId: selectedFlag.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`ดำเนินการ${action === 'approve' ? 'อนุมัติ' : action === 'reject' ? 'ปฏิเสธ' : 'ลบ'}สำเร็จ`);
        loadFlags();
        actionModal.onClose();
        detailModal.onClose();
        setActionReason('');
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error performing moderation action:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  }

  function getFlagTypeColor(flagType: string) {
    const colors: Record<string, 'danger' | 'warning' | 'default'> = {
      spam: 'default',
      inappropriate: 'danger',
      harassment: 'danger',
      false_information: 'warning',
      copyright: 'warning',
      other: 'default',
    };
    return colors[flagType] || 'default';
  }

  function getStatusColor(status: string) {
    const colors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      pending: 'warning',
      reviewed: 'default',
      approved: 'success',
      rejected: 'danger',
      resolved: 'success',
    };
    return colors[status] || 'default';
  }

  const stats = {
    pending: flags.filter(f => f.status === 'pending').length,
    reviewed: flags.filter(f => f.status === 'reviewed').length,
    resolved: flags.filter(f => f.status === 'resolved' || f.status === 'approved' || f.status === 'rejected').length,
    total: flags.length,
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการเนื้อหา"
        headerSubtitle="ตรวจสอบและจัดการเนื้อหาที่ถูกแจ้งเตือน"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <div className="flex justify-center items-center py-20">
          <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการเนื้อหา"
        headerSubtitle="ตรวจสอบและจัดการเนื้อหาที่ถูกแจ้งเตือน"
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
                  <p className="text-zinc-400 text-sm">รอตรวจสอบ</p>
                  <p className="font-bold text-2xl text-yellow-500">{stats.pending}</p>
                </div>
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">กำลังตรวจสอบ</p>
                  <p className="font-bold text-2xl text-blue-500">{stats.reviewed}</p>
                </div>
                <EyeIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">แก้ไขแล้ว</p>
                  <p className="font-bold text-2xl text-green-500">{stats.resolved}</p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">ทั้งหมด</p>
                  <p className="font-bold text-2xl">{stats.total}</p>
                </div>
                <FlagIcon className="w-8 h-8 text-red-500" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-80">
                <Input
                  placeholder="ค้นหา..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startContent={<MagnifyingGlassIcon className="w-4 h-4 text-zinc-400" />}
                  classNames={{
                    base: 'w-full',
                    input: 'text-sm',
                  }}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tabs */}
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => {
            setSelectedTab(key as string);
            loadFlags();
          }}
          className="mb-6"
        >
          <Tab key="pending" title={`รอตรวจสอบ (${stats.pending})`} />
          <Tab key="reviewed" title={`กำลังตรวจสอบ (${stats.reviewed})`} />
          <Tab key="resolved" title={`แก้ไขแล้ว (${stats.resolved})`} />
          <Tab key="all" title={`ทั้งหมด (${stats.total})`} />
        </Tabs>

        {/* Flags Table */}
        <Card>
          <CardBody>
            <Table aria-label="Content flags table">
              <TableHeader>
                <TableColumn>ประเภทเนื้อหา</TableColumn>
                <TableColumn>ประเภทการแจ้งเตือน</TableColumn>
                <TableColumn>เหตุผล</TableColumn>
                <TableColumn>ผู้แจ้งเตือน</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>วันที่</TableColumn>
                <TableColumn>การจัดการ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบรายการแจ้งเตือน">
                {filteredFlags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {flag.content_type}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" color={getFlagTypeColor(flag.flag_type)} variant="flat">
                        {flag.flag_type}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm line-clamp-1">{flag.reason || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{flag.reported_by_user?.email || 'Unknown'}</span>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" color={getStatusColor(flag.status)} variant="flat">
                        {flag.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(flag.created_at).toLocaleDateString('th-TH')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onPress={() => {
                            setSelectedFlag(flag);
                            detailModal.onOpen();
                          }}
                        >
                          <EyeIcon className="w-4 h-4" />
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

      {/* Flag Detail Modal */}
      <Modal
        isOpen={detailModal.isOpen}
        onClose={detailModal.onClose}
        size="3xl"
        scrollBehavior="inside"
        classNames={{
          body: 'py-6',
          backdrop: 'bg-[#292f46]/50 backdrop-opacity-40',
          base: 'border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]',
          header: 'border-b-[1px] border-[#292f46]',
          footer: 'border-t-[1px] border-[#292f46]',
          closeButton: 'hover:bg-white/5 active:bg-white/10',
        }}
      >
        <ModalContent>
          <ModalHeader>รายละเอียดการแจ้งเตือน</ModalHeader>
          <ModalBody>
            {selectedFlag && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-400">ประเภทเนื้อหา</label>
                  <p className="text-white">{selectedFlag.content_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400">ประเภทการแจ้งเตือน</label>
                  <Chip size="sm" color={getFlagTypeColor(selectedFlag.flag_type)} variant="flat">
                    {selectedFlag.flag_type}
                  </Chip>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400">เหตุผล</label>
                  <p className="text-white">{selectedFlag.reason || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400">ผู้แจ้งเตือน</label>
                  <p className="text-white">{selectedFlag.reported_by_user?.email || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400">สถานะ</label>
                  <Chip size="sm" color={getStatusColor(selectedFlag.status)} variant="flat">
                    {selectedFlag.status}
                  </Chip>
                </div>
                {selectedFlag.moderation_notes && (
                  <div>
                    <label className="text-sm font-medium text-zinc-400">หมายเหตุ</label>
                    <p className="text-white">{selectedFlag.moderation_notes}</p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onPress={() => {
                if (selectedFlag) {
                  setActionType('delete');
                  actionModal.onOpen();
                }
              }}
            >
              <TrashIcon className="w-4 h-4" />
              ลบเนื้อหา
            </Button>
            <Button
              color="danger"
              variant="flat"
              onPress={() => {
                if (selectedFlag) {
                  setActionType('reject');
                  actionModal.onOpen();
                }
              }}
            >
              <XCircleIcon className="w-4 h-4" />
              ปฏิเสธ
            </Button>
            <Button
              color="success"
              onPress={() => {
                if (selectedFlag) {
                  setActionType('approve');
                  actionModal.onOpen();
                }
              }}
            >
              <CheckCircleIcon className="w-4 h-4" />
              อนุมัติ
            </Button>
            <Button
              color="default"
              variant="light"
              onPress={() => {
                if (selectedFlag) {
                  handleUpdateFlagStatus(selectedFlag.id, 'resolved');
                }
              }}
            >
              แก้ไขแล้ว
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={actionModal.onClose}
        classNames={{
          body: 'py-6',
          backdrop: 'bg-[#292f46]/50 backdrop-opacity-40',
          base: 'border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]',
          header: 'border-b-[1px] border-[#292f46]',
          footer: 'border-t-[1px] border-[#292f46]',
          closeButton: 'hover:bg-white/5 active:bg-white/10',
        }}
      >
        <ModalContent>
          <ModalHeader>
            ยืนยันการดำเนินการ
          </ModalHeader>
          <ModalBody>
            <Textarea
              label="เหตุผล (Optional)"
              placeholder="ระบุเหตุผลสำหรับการดำเนินการนี้"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              minRows={3}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={actionModal.onClose}
            >
              ยกเลิก
            </Button>
            <Button
              color={actionType === 'approve' ? 'success' : 'danger'}
              onPress={() => actionType && handleModerationAction(actionType)}
            >
              ยืนยัน
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default function AdminModerationPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminModerationContent />
    </RoleGuard>
  );
}

