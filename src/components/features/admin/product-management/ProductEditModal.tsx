import { useState, useEffect } from 'react';
import { Input, Textarea, Switch } from '@heroui/react';
import AdminFormModal from '../shared/AdminFormModal';

interface Product {
  id: string;
  slug: string;
  nameThai?: string | null;
  nameEnglish?: string | null;
  description?: string | null;
  price: number;
  stock: number;
  categoryId?: string | null;
  sku?: string | null;
  weightKg?: number | null;
  dimensions?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
}

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (productId: string, data: Partial<Product>) => Promise<boolean>;
  isProcessing: boolean;
}

export default function ProductEditModal({
  isOpen,
  onClose,
  product,
  onSave,
  isProcessing,
}: ProductEditModalProps) {
  const [formData, setFormData] = useState({
    nameThai: '',
    nameEnglish: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    sku: '',
    weightKg: '',
    dimensions: '',
    isActive: true,
    isFeatured: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        nameThai: product.nameThai || '',
        nameEnglish: product.nameEnglish || '',
        description: product.description || '',
        price: product.price.toString(),
        stock: product.stock.toString(),
        categoryId: product.categoryId || '',
        sku: product.sku || '',
        weightKg: product.weightKg?.toString() || '',
        dimensions: product.dimensions || '',
        isActive: product.isActive !== false,
        isFeatured: product.isFeatured || false,
      });
      setErrors({});
    }
  }, [product]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nameThai.trim()) {
      newErrors.nameThai = 'กรุณากรอกชื่อไทย';
    }
    if (!formData.nameEnglish.trim()) {
      newErrors.nameEnglish = 'กรุณากรอกชื่ออังกฤษ';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'กรุณากรอกราคาที่ถูกต้อง';
    }
    if (formData.stock === '' || parseInt(formData.stock) < 0) {
      newErrors.stock = 'กรุณากรอกจำนวนสต็อกที่ถูกต้อง';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!product || !validateForm()) return;

    const updateData: Partial<Product> = {
      nameThai: formData.nameThai.trim(),
      nameEnglish: formData.nameEnglish.trim(),
      description: formData.description.trim() || undefined,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      categoryId: formData.categoryId || undefined,
      sku: formData.sku.trim() || undefined,
      weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
      dimensions: formData.dimensions.trim() || undefined,
      isActive: formData.isActive,
      isFeatured: formData.isFeatured,
    };

    const success = await onSave(product.id, updateData);
    if (success) {
      onClose();
    }
  };

  const isFormValid = Object.keys(errors).length === 0 &&
    !!formData.nameThai.trim() &&
    !!formData.nameEnglish.trim() &&
    !!formData.price &&
    parseFloat(formData.price) > 0 &&
    formData.stock !== '' &&
    parseInt(formData.stock) >= 0;

  if (!product) return null;

  return (
    <AdminFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="แก้ไขสินค้า"
      subtitle={product.nameThai || product.nameEnglish || 'Product'}
      size="3xl"
      onSubmit={handleSubmit}
      isProcessing={isProcessing}
      isFormValid={isFormValid}
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

        <Textarea
          label="รายละเอียด"
          value={formData.description}
          onValueChange={(value) => setFormData({ ...formData, description: value })}
          minRows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="ราคา (฿) *"
            type="number"
            value={formData.price}
            onValueChange={(value) => setFormData({ ...formData, price: value })}
            isInvalid={!!errors.price}
            errorMessage={errors.price}
            isRequired
            startContent={<span className="text-zinc-400">฿</span>}
          />
          <Input
            label="จำนวนสต็อก *"
            type="number"
            value={formData.stock}
            onValueChange={(value) => setFormData({ ...formData, stock: value })}
            isInvalid={!!errors.stock}
            errorMessage={errors.stock}
            isRequired
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="SKU"
            value={formData.sku}
            onValueChange={(value) => setFormData({ ...formData, sku: value })}
            placeholder="รหัสสินค้า"
          />
          <Input
            label="หมวดหมู่ (Category ID)"
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            placeholder="UUID ของหมวดหมู่"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="น้ำหนัก (กก.)"
            type="number"
            value={formData.weightKg}
            onValueChange={(value) => setFormData({ ...formData, weightKg: value })}
            placeholder="0.00"
          />
          <Input
            label="ขนาด"
            value={formData.dimensions}
            onValueChange={(value) => setFormData({ ...formData, dimensions: value })}
            placeholder="เช่น 10x20x30 ซม."
          />
        </div>

        <div className="flex gap-4">
          <Switch
            isSelected={formData.isActive}
            onValueChange={(value) => setFormData({ ...formData, isActive: value })}
          >
            เปิดใช้งาน
          </Switch>
          <Switch
            isSelected={formData.isFeatured}
            onValueChange={(value) => setFormData({ ...formData, isFeatured: value })}
          >
            สินค้าแนะนำ
          </Switch>
        </div>
      </div>
    </AdminFormModal>
  );
}

