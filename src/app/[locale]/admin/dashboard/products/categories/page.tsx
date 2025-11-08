"use client";

import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { createClient } from '@/lib/database/supabase/client';
import { RoleGuard } from '@/components/features/auth';
import { DashboardLayout } from '@/components/shared';
import { adminMenuItems } from '@/components/features/admin/adminMenuItems';
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Input, useDisclosure } from '@heroui/react';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import AdminFormModal from '@/components/features/admin/shared/AdminFormModal';
import AdminConfirmDialog from '@/components/features/admin/shared/AdminConfirmDialog';

interface Category {
  id: string;
  nameThai: string;
  nameEnglish: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function AdminCategoriesContent() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const createModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteDialog = useDisclosure();

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
      const response = await fetch('/api/product-categories');
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

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cat =>
        cat.nameThai?.toLowerCase().includes(query) ||
        cat.nameEnglish?.toLowerCase().includes(query) ||
        cat.slug?.toLowerCase().includes(query)
      );
    }

    setFilteredCategories(filtered);
  }

  async function handleDelete(categoryId: string) {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/product-categories/${categoryId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Category deleted successfully');
        await loadCategories();
        return true;
      } else {
        toast.error(data.error || 'Failed to delete category');
        return false;
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }

  const stats = {
    total: categories.length,
    active: categories.filter(c => c.isActive).length,
    inactive: categories.filter(c => !c.isActive).length,
  };

  if (isLoading) {
    return (
      <DashboardLayout
        menuItems={adminMenuItems}
        headerTitle="จัดการหมวดหมู่สินค้า"
        headerSubtitle="จัดการหมวดหมู่สินค้าทั้งหมด"
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
        headerTitle="จัดการหมวดหมู่สินค้า"
        headerSubtitle="จัดการหมวดหมู่สินค้าทั้งหมด"
        roleLabel="ผู้ดูแลระบบ"
        roleColor="danger"
        userEmail={user?.email}
      >
        <Toaster position="top-right" />

        {/* Stats Cards */}
        <div className="gap-4 grid grid-cols-1 md:grid-cols-3 mb-6">
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">หมวดหมู่ทั้งหมด</p>
                  <p className="font-bold text-2xl">{stats.total}</p>
                </div>
                <TagIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">เปิดใช้งาน</p>
                  <p className="font-bold text-2xl text-green-500">{stats.active}</p>
                </div>
                <TagIcon className="w-8 h-8 text-green-500" />
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
                <TagIcon className="w-8 h-8 text-red-500" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="top-1/2 left-3 absolute w-5 h-5 text-zinc-400 -translate-y-1/2" />
                <Input
                  placeholder="ค้นหาหมวดหมู่..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="pl-10"
                  startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                />
              </div>
              <Button
                color="primary"
                startContent={<PlusIcon className="w-5 h-5" />}
                onPress={createModal.onOpen}
              >
                เพิ่มหมวดหมู่ใหม่
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardBody>
            <Table aria-label="Categories table">
              <TableHeader>
                <TableColumn>หมวดหมู่</TableColumn>
                <TableColumn>Slug</TableColumn>
                <TableColumn>ลำดับ</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn>การจัดการ</TableColumn>
              </TableHeader>
              <TableBody emptyContent="ไม่พบหมวดหมู่">
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {category.image && (
                          <div className="relative w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={category.image}
                              alt={category.nameThai}
                              fill
                              sizes='100%'
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">
                            {category.nameThai}
                          </p>
                          <p className="text-zinc-400 text-sm">
                            {category.nameEnglish}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-sm">{category.slug}</p>
                    </TableCell>
                    <TableCell>
                      <p>{category.displayOrder}</p>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={category.isActive ? 'success' : 'danger'}
                        variant="flat"
                        size="sm"
                      >
                        {category.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            setSelectedCategory(category);
                            editModal.onOpen();
                          }}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => {
                            setSelectedCategory(category);
                            deleteDialog.onOpen();
                          }}
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

      {/* Category Create/Edit Modal */}
      <CategoryFormModal
        isOpen={createModal.isOpen || editModal.isOpen}
        onClose={() => {
          createModal.onClose();
          editModal.onClose();
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSave={async (data) => {
          try {
            setIsProcessing(true);
            const url = selectedCategory
              ? `/api/product-categories/${selectedCategory.id}`
              : '/api/product-categories';
            const method = selectedCategory ? 'PUT' : 'POST';

            const response = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
              toast.success(selectedCategory ? 'อัปเดตหมวดหมู่สำเร็จ' : 'สร้างหมวดหมู่สำเร็จ');
              await loadCategories();
              createModal.onClose();
              editModal.onClose();
              setSelectedCategory(null);
              return true;
            } else {
              toast.error(result.error || 'Failed to save category');
              return false;
            }
          } catch (error) {
            console.error('Error saving category:', error);
            toast.error('Failed to save category');
            return false;
          } finally {
            setIsProcessing(false);
          }
        }}
        isProcessing={isProcessing}
      />

      {/* Delete Dialog */}
      {selectedCategory && (
        <AdminConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={deleteDialog.onClose}
          title="ลบหมวดหมู่"
          message={`คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "${selectedCategory.nameThai}"?`}
          warningMessage="หากมีสินค้าใช้หมวดหมู่นี้ จะไม่สามารถลบได้"
          confirmText="ลบหมวดหมู่"
          confirmColor="danger"
          onConfirm={async () => {
            const success = await handleDelete(selectedCategory.id);
            if (success) {
              deleteDialog.onClose();
              setSelectedCategory(null);
            }
          }}
          isProcessing={isProcessing}
        />
      )}
    </>
  );
}

// Category Form Modal Component
interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSave: (data: {
    nameThai: string;
    nameEnglish: string;
    description?: string;
    image?: string;
    displayOrder?: number;
    isActive?: boolean;
  }) => Promise<boolean>;
  isProcessing: boolean;
}

function CategoryFormModal({
  isOpen,
  onClose,
  category,
  onSave,
  isProcessing,
}: CategoryFormModalProps) {
  const [formData, setFormData] = useState({
    nameThai: '',
    nameEnglish: '',
    description: '',
    image: '',
    displayOrder: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        nameThai: category.nameThai || '',
        nameEnglish: category.nameEnglish || '',
        description: category.description || '',
        image: category.image || '',
        displayOrder: category.displayOrder || 0,
        isActive: category.isActive !== false,
      });
    } else {
      setFormData({
        nameThai: '',
        nameEnglish: '',
        description: '',
        image: '',
        displayOrder: 0,
        isActive: true,
      });
    }
    setErrors({});
  }, [category, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nameThai.trim()) {
      newErrors.nameThai = 'กรุณากรอกชื่อไทย';
    }
    if (!formData.nameEnglish.trim()) {
      newErrors.nameEnglish = 'กรุณากรอกชื่ออังกฤษ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const success = await onSave({
      nameThai: formData.nameThai.trim(),
      nameEnglish: formData.nameEnglish.trim(),
      description: formData.description.trim() || undefined,
      image: formData.image.trim() || undefined,
      displayOrder: formData.displayOrder,
      isActive: formData.isActive,
    });

    if (success) {
      setFormData({
        nameThai: '',
        nameEnglish: '',
        description: '',
        image: '',
        displayOrder: 0,
        isActive: true,
      });
      setErrors({});
    }
  };

  const isFormValid = Object.keys(errors).length === 0 &&
    !!formData.nameThai.trim() &&
    !!formData.nameEnglish.trim();

  return (
    <AdminFormModal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
      subtitle={category?.nameThai || 'กรอกข้อมูลหมวดหมู่'}
      size="2xl"
      onSubmit={handleSubmit}
      isProcessing={isProcessing}
      isFormValid={isFormValid}
      submitText={category ? 'อัปเดต' : 'สร้าง'}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="ชื่อไทย *"
            value={formData.nameThai}
            onValueChange={(value) => setFormData({ ...formData, nameThai: value })}
            isInvalid={!!errors.nameThai}
            errorMessage={errors.nameThai}
            isRequired
          />
          <Input
            label="ชื่ออังกฤษ *"
            value={formData.nameEnglish}
            onValueChange={(value) => setFormData({ ...formData, nameEnglish: value })}
            isInvalid={!!errors.nameEnglish}
            errorMessage={errors.nameEnglish}
            isRequired
          />
        </div>

        <Input
          label="คำอธิบาย"
          value={formData.description}
          onValueChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="คำอธิบายหมวดหมู่"
        />

        <Input
          label="URL รูปภาพ"
          value={formData.image}
          onValueChange={(value) => setFormData({ ...formData, image: value })}
          placeholder="https://example.com/image.jpg"
        />

        <Input
          label="ลำดับการแสดง"
          type="number"
          value={formData.displayOrder.toString()}
          onValueChange={(value) => setFormData({ ...formData, displayOrder: parseInt(value) || 0 })}
          min="0"
        />
      </div>
    </AdminFormModal>
  );
}

export default function AdminCategoriesPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminCategoriesContent />
    </RoleGuard>
  );
}

