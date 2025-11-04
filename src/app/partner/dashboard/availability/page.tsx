"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout, type MenuItem } from '@/components/shared';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
} from '@heroui/react';
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  CalendarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  HomeIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';

interface RegularAvailability {
  id: string;
  day_of_week: string;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  max_capacity: number | null;
  notes: string | null;
}

interface SpecialAvailability {
  id: string;
  date: string;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  max_capacity: number | null;
  reason: string | null;
  notes: string | null;
}

const dayNames = [
  { value: 'monday', label: 'จันทร์' },
  { value: 'tuesday', label: 'อังคาร' },
  { value: 'wednesday', label: 'พุธ' },
  { value: 'thursday', label: 'พฤหัสบดี' },
  { value: 'friday', label: 'ศุกร์' },
  { value: 'saturday', label: 'เสาร์' },
  { value: 'sunday', label: 'อาทิตย์' },
];

function AvailabilityManagementContent() {
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [regularAvailability, setRegularAvailability] = useState<RegularAvailability[]>([]);
  const [specialAvailability, setSpecialAvailability] = useState<SpecialAvailability[]>([]);
  const [selectedTab, setSelectedTab] = useState<'regular' | 'special'>('regular');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingItem, setEditingItem] = useState<RegularAvailability | SpecialAvailability | null>(null);
  const [formData, setFormData] = useState({
    day_of_week: '',
    date: '',
    is_open: true,
    open_time: '',
    close_time: '',
    max_capacity: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      await loadAvailability();
      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const loadAvailability = async () => {
    try {
      const response = await fetch('/api/partner/availability');
      const result = await response.json();

      if (result.success) {
        setRegularAvailability(result.data.regularAvailability || []);
        setSpecialAvailability(result.data.specialAvailability ? [result.data.specialAvailability] : []);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    }
  };

  const handleOpenModal = (item?: RegularAvailability | SpecialAvailability) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        day_of_week: (item as RegularAvailability).day_of_week || '',
        date: (item as SpecialAvailability).date || '',
        is_open: item.is_open,
        open_time: item.open_time || '',
        close_time: item.close_time || '',
        max_capacity: item.max_capacity?.toString() || '',
        reason: (item as SpecialAvailability).reason || '',
        notes: item.notes || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        day_of_week: '',
        date: '',
        is_open: true,
        open_time: '',
        close_time: '',
        max_capacity: '',
        reason: '',
        notes: '',
      });
    }
    onOpen();
  };

  const handleSave = async () => {
    try {
      const type = selectedTab === 'regular' ? 'regular' : 'special';
      const payload = {
        type,
        data: selectedTab === 'regular' ? {
          day_of_week: formData.day_of_week,
          is_open: formData.is_open,
          open_time: formData.open_time || null,
          close_time: formData.close_time || null,
          max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
          notes: formData.notes || null,
        } : {
          date: formData.date,
          is_open: formData.is_open,
          open_time: formData.open_time || null,
          close_time: formData.close_time || null,
          max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
          reason: formData.reason || null,
          notes: formData.notes || null,
        },
      };

      const response = await fetch('/api/partner/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('บันทึกสำเร็จ');
        onClose();
        await loadAvailability();
      } else {
        toast.error(result.error || 'บันทึกไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (id: string, type: 'regular' | 'special') => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/partner/availability?type=${type}&id=${id}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('ลบสำเร็จ');
        await loadAvailability();
      } else {
        toast.error(result.error || 'ลบไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const menuItems: MenuItem[] = [
    { label: 'แดชบอร์ด', href: '/partner/dashboard', icon: HomeIcon },
    { label: 'ข้อมูลยิม', href: '/partner/dashboard/gym', icon: BuildingStorefrontIcon },
    { label: 'โปรโมชั่น', href: '/partner/dashboard/promotions', icon: MegaphoneIcon },
    { label: 'ประวัติการจอง', href: '/partner/dashboard/bookings', icon: CalendarIcon },
    { label: 'ปฏิทินการจอง', href: '/partner/dashboard/bookings/calendar', icon: CalendarIcon },
    { label: 'จัดการความพร้อมใช้งาน', href: '/partner/dashboard/availability', icon: CalendarIcon },
    { label: 'รายการธุรกรรม', href: '/partner/dashboard/transactions', icon: BanknotesIcon },
    { label: 'การจ่ายเงิน', href: '/partner/dashboard/payouts', icon: CurrencyDollarIcon },
    { label: 'สถิติ', href: '/partner/dashboard/analytics', icon: ChartBarIcon },
    { label: 'Performance Metrics', href: '/partner/dashboard/performance', icon: ChartBarIcon },
    { label: 'ตั้งค่า', href: '/partner/dashboard/settings', icon: Cog6ToothIcon },
  ];

  if (isLoading) {
    return (
      <RoleGuard allowedRole="partner">
        <DashboardLayout
          menuItems={menuItems}
          headerTitle="จัดการความพร้อมใช้งาน"
          headerSubtitle="ตั้งค่าเวลาเปิด-ปิดและความจุ"
          roleLabel="พาร์ทเนอร์"
          roleColor="primary"
          userEmail={user?.email}
        >
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRole="partner">
      <DashboardLayout
        menuItems={menuItems}
        headerTitle="จัดการความพร้อมใช้งาน"
        headerSubtitle="ตั้งค่าเวลาเปิด-ปิดและความจุ"
        roleLabel="พาร์ทเนอร์"
        roleColor="primary"
        userEmail={user?.email}
      >
        <Toaster />

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">ความพร้อมใช้งาน</h3>
              <Button
                color="primary"
                startContent={<PlusIcon className="w-5 h-5" />}
                onPress={() => handleOpenModal()}
              >
                เพิ่มรายการ
              </Button>
            </CardHeader>
            <CardBody>
              <div className="flex gap-4 mb-4">
                <Button
                  variant={selectedTab === 'regular' ? 'solid' : 'flat'}
                  onPress={() => setSelectedTab('regular')}
                >
                  กำหนดการปกติ
                </Button>
                <Button
                  variant={selectedTab === 'special' ? 'solid' : 'flat'}
                  onPress={() => setSelectedTab('special')}
                >
                  กำหนดการพิเศษ
                </Button>
              </div>

              {selectedTab === 'regular' ? (
                <Table aria-label="Regular availability">
                  <TableHeader>
                    <TableColumn>วัน</TableColumn>
                    <TableColumn>สถานะ</TableColumn>
                    <TableColumn>เวลาเปิด</TableColumn>
                    <TableColumn>เวลาปิด</TableColumn>
                    <TableColumn>ความจุ</TableColumn>
                    <TableColumn>จัดการ</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {regularAvailability.map((item) => {
                      const dayName = dayNames.find(d => d.value === item.day_of_week)?.label || item.day_of_week;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{dayName}</TableCell>
                          <TableCell>
                            <Chip color={item.is_open ? 'success' : 'danger'} size="sm">
                              {item.is_open ? 'เปิด' : 'ปิด'}
                            </Chip>
                          </TableCell>
                          <TableCell>{item.open_time || '-'}</TableCell>
                          <TableCell>{item.close_time || '-'}</TableCell>
                          <TableCell>{item.max_capacity || 'ไม่จำกัด'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => handleOpenModal(item)}
                              >
                                <PencilIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => handleDelete(item.id, 'regular')}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Table aria-label="Special availability">
                  <TableHeader>
                    <TableColumn>วันที่</TableColumn>
                    <TableColumn>สถานะ</TableColumn>
                    <TableColumn>เวลาเปิด</TableColumn>
                    <TableColumn>เวลาปิด</TableColumn>
                    <TableColumn>เหตุผล</TableColumn>
                    <TableColumn>จัดการ</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {specialAvailability.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{new Date(item.date).toLocaleDateString('th-TH')}</TableCell>
                        <TableCell>
                          <Chip color={item.is_open ? 'success' : 'danger'} size="sm">
                            {item.is_open ? 'เปิด' : 'ปิด'}
                          </Chip>
                        </TableCell>
                        <TableCell>{item.open_time || '-'}</TableCell>
                        <TableCell>{item.close_time || '-'}</TableCell>
                        <TableCell>{item.reason || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => handleOpenModal(item)}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => handleDelete(item.id, 'special')}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Add/Edit Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
          <ModalContent>
            <ModalHeader>
              {editingItem ? 'แก้ไข' : 'เพิ่ม'} {selectedTab === 'regular' ? 'กำหนดการปกติ' : 'กำหนดการพิเศษ'}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {selectedTab === 'regular' ? (
                  <Select
                    label="วัน"
                    selectedKeys={formData.day_of_week ? [formData.day_of_week] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setFormData({ ...formData, day_of_week: selected });
                    }}
                  >
                    {dayNames.map((day) => (
                      <SelectItem key={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </Select>
                ) : (
                  <Input
                    type="date"
                    label="วันที่"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                )}

                <Switch
                  isSelected={formData.is_open}
                  onValueChange={(value) => setFormData({ ...formData, is_open: value })}
                >
                  เปิดใช้งาน
                </Switch>

                {formData.is_open && (
                  <>
                    <Input
                      type="time"
                      label="เวลาเปิด"
                      value={formData.open_time}
                      onChange={(e) => setFormData({ ...formData, open_time: e.target.value })}
                    />
                    <Input
                      type="time"
                      label="เวลาปิด"
                      value={formData.close_time}
                      onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                    />
                    <Input
                      type="number"
                      label="ความจุสูงสุด (ไม่จำกัดให้เว้นว่าง)"
                      value={formData.max_capacity}
                      onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                    />
                  </>
                )}

                {selectedTab === 'special' && (
                  <Input
                    label="เหตุผล"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="เช่น วันหยุด, ซ่อมบำรุง, กิจกรรมพิเศษ"
                  />
                )}

                <Input
                  label="หมายเหตุ"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                ยกเลิก
              </Button>
              <Button color="primary" onPress={handleSave}>
                บันทึก
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </DashboardLayout>
    </RoleGuard>
  );
}

export default AvailabilityManagementContent;

