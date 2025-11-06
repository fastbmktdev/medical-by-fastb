"use client";

import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Input,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';

interface EventCategory {
  id: string;
  name_thai: string;
  name_english: string;
  slug: string;
  description?: string;
  description_en?: string;
  icon?: string;
  color?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function EventCategoriesContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<EventCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);

  const createModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteDialog = useDisclosure();

  const [formData, setFormData] = useState({
    name_thai: '',
    name_english: '',
    slug: '',
    description: '',
    description_en: '',
    icon: '',
    color: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    loadUser();
    loadCategories();
  }, [supabase]);

  useEffect(() => {
    filterCategories();
  }, [categories, searchQuery]);

  async function loadCategories() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/event-categories');
      const data = await response.json();

      if (data.success) {
        setCategories(data.data || []);
      } else {
        toast.error(data.error || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }

  function filterCategories() {
    let filtered = [...categories];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (cat) =>
          cat.name_thai.toLowerCase().includes(query) ||
          cat.name_english.toLowerCase().includes(query) ||
          cat.slug.toLowerCase().includes(query)
      );
    }

    setFilteredCategories(filtered);
  }

  function handleCreate() {
    setFormData({
      name_thai: '',
      name_english: '',
      slug: '',
      description: '',
      description_en: '',
      icon: '',
      color: '',
      display_order: 0,
      is_active: true,
    });
    setSelectedCategory(null);
    createModal.onOpen();
  }

  function handleEdit(category: EventCategory) {
    setSelectedCategory(category);
    setFormData({
      name_thai: category.name_thai,
      name_english: category.name_english,
      slug: category.slug,
      description: category.description || '',
      description_en: category.description_en || '',
      icon: category.icon || '',
      color: category.color || '',
      display_order: category.display_order,
      is_active: category.is_active,
    });
    editModal.onOpen();
  }

  function handleDelete(category: EventCategory) {
    setSelectedCategory(category);
    deleteDialog.onOpen();
  }

  async function handleSubmit() {
    try {
      const url = selectedCategory
        ? `/api/event-categories/${selectedCategory.id}`
        : '/api/event-categories';
      const method = selectedCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(selectedCategory ? 'แก้ไขสำเร็จ' : 'สร้างสำเร็จ');
        loadCategories();
        createModal.onClose();
        editModal.onClose();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  }

  async function handleConfirmDelete() {
    if (!selectedCategory) return;

    try {
      const response = await fetch(`/api/event-categories/${selectedCategory.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('ลบสำเร็จ');
        loadCategories();
        deleteDialog.onClose();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('เกิดข้อผิดพลาดในการลบ');
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="หมวดหมู่อีเวนต์"
        headerSubtitle="จัดการหมวดหมู่อีเวนต์"
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
        headerTitle="หมวดหมู่อีเวนต์"
        headerSubtitle="จัดการหมวดหมู่อีเวนต์ทั้งหมด"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <Toaster position="top-right" />

        {/* Search and Actions */}
        <div className="flex justify-between items-center gap-4 mb-6">
          <Input
            placeholder="ค้นหาหมวดหมู่..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<MagnifyingGlassIcon className="w-5 h-5 text-zinc-400" />}
            className="max-w-xs"
            variant="bordered"
          />
          <Button
            color="primary"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={handleCreate}
          >
            สร้างหมวดหมู่ใหม่
          </Button>
        </div>

        {/* Categories Table */}
        <Card>
          <CardBody>
            <Table aria-label="Event categories table">
              <TableHeader>
                <TableColumn>ชื่อไทย</TableColumn>
                <TableColumn>ชื่ออังกฤษ</TableColumn>
                <TableColumn>Slug</TableColumn>
                <TableColumn>ลำดับ</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบหมวดหมู่">
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {category.icon && <span>{category.icon}</span>}
                        <span className="font-semibold">{category.name_thai}</span>
                      </div>
                    </TableCell>
                    <TableCell>{category.name_english}</TableCell>
                    <TableCell>
                      <code className="bg-zinc-800 px-2 py-1 rounded text-sm">{category.slug}</code>
                    </TableCell>
                    <TableCell>{category.display_order}</TableCell>
                    <TableCell>
                      <Chip
                        color={category.is_active ? 'success' : 'default'}
                        size="sm"
                        variant="flat"
                      >
                        {category.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleEdit(category)}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDelete(category)}
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

        {/* Create Modal */}
        <Modal isOpen={createModal.isOpen} onClose={createModal.onClose} size="2xl">
          <ModalContent>
            <ModalHeader>สร้างหมวดหมู่อีเวนต์ใหม่</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label="ชื่อไทย *"
                  value={formData.name_thai}
                  onValueChange={(value) => setFormData({ ...formData, name_thai: value })}
                  variant="bordered"
                  isRequired
                />
                <Input
                  label="ชื่ออังกฤษ *"
                  value={formData.name_english}
                  onValueChange={(value) => setFormData({ ...formData, name_english: value })}
                  variant="bordered"
                  isRequired
                />
                <Input
                  label="Slug *"
                  value={formData.slug}
                  onValueChange={(value) => setFormData({ ...formData, slug: value })}
                  variant="bordered"
                  isRequired
                  description="URL-friendly identifier (e.g., championship-fight)"
                />
                <Input
                  label="คำอธิบาย"
                  value={formData.description}
                  onValueChange={(value) => setFormData({ ...formData, description: value })}
                  variant="bordered"
                  as="textarea"
                  rows={3}
                />
                <Input
                  label="คำอธิบาย (อังกฤษ)"
                  value={formData.description_en}
                  onValueChange={(value) => setFormData({ ...formData, description_en: value })}
                  variant="bordered"
                  as="textarea"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Icon"
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                    variant="bordered"
                    placeholder="🥊"
                    description="Emoji หรือ icon"
                  />
                  <Input
                    label="Color"
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                    variant="bordered"
                    placeholder="#FF0000"
                    description="Hex color code"
                  />
                </div>
                <Input
                  label="ลำดับการแสดง"
                  type="number"
                  value={formData.display_order.toString()}
                  onValueChange={(value) => setFormData({ ...formData, display_order: parseInt(value) || 0 })}
                  variant="bordered"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm">
                    เปิดใช้งาน
                  </label>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={createModal.onClose}>
                ยกเลิก
              </Button>
              <Button color="primary" onPress={handleSubmit}>
                สร้าง
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} size="2xl">
          <ModalContent>
            <ModalHeader>แก้ไขหมวดหมู่อีเวนต์</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label="ชื่อไทย *"
                  value={formData.name_thai}
                  onValueChange={(value) => setFormData({ ...formData, name_thai: value })}
                  variant="bordered"
                  isRequired
                />
                <Input
                  label="ชื่ออังกฤษ *"
                  value={formData.name_english}
                  onValueChange={(value) => setFormData({ ...formData, name_english: value })}
                  variant="bordered"
                  isRequired
                />
                <Input
                  label="Slug *"
                  value={formData.slug}
                  onValueChange={(value) => setFormData({ ...formData, slug: value })}
                  variant="bordered"
                  isRequired
                />
                <Input
                  label="คำอธิบาย"
                  value={formData.description}
                  onValueChange={(value) => setFormData({ ...formData, description: value })}
                  variant="bordered"
                  as="textarea"
                  rows={3}
                />
                <Input
                  label="คำอธิบาย (อังกฤษ)"
                  value={formData.description_en}
                  onValueChange={(value) => setFormData({ ...formData, description_en: value })}
                  variant="bordered"
                  as="textarea"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Icon"
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                    variant="bordered"
                  />
                  <Input
                    label="Color"
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                    variant="bordered"
                  />
                </div>
                <Input
                  label="ลำดับการแสดง"
                  type="number"
                  value={formData.display_order.toString()}
                  onValueChange={(value) => setFormData({ ...formData, display_order: parseInt(value) || 0 })}
                  variant="bordered"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active_edit"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active_edit" className="text-sm">
                    เปิดใช้งาน
                  </label>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={editModal.onClose}>
                ยกเลิก
              </Button>
              <Button color="primary" onPress={handleSubmit}>
                บันทึก
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Dialog */}
        <Modal isOpen={deleteDialog.isOpen} onClose={deleteDialog.onClose}>
          <ModalContent>
            <ModalHeader>ยืนยันการลบ</ModalHeader>
            <ModalBody>
              <p>
                คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ &quot;{selectedCategory?.name_thai}&quot;?
                <br />
                <span className="text-zinc-400 text-sm">
                  หากมีอีเวนต์ที่ใช้หมวดหมู่นี้อยู่ จะไม่สามารถลบได้
                </span>
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={deleteDialog.onClose}>
                ยกเลิก
              </Button>
              <Button color="danger" onPress={handleConfirmDelete}>
                ลบ
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </DashboardLayout>
    </>
  );
}

export default function EventCategoriesPage() {
  return (
    <RoleGuard allowedRole="admin">
      <EventCategoriesContent />
    </RoleGuard>
  );
}

