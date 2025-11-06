import { useState, useEffect } from 'react';
import { Button, Input, Select, SelectItem, Switch, Chip } from '@heroui/react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import AdminFormModal from '../shared/AdminFormModal';

interface Variant {
  id?: string;
  type: string;
  name: string;
  value: string;
  priceAdjustment: number;
  stock: number;
  sku?: string | null;
  isDefault: boolean;
  displayOrder: number;
}

interface ProductVariantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    nameThai?: string | null;
    nameEnglish?: string | null;
  } | null;
  variants: Variant[];
  onSave: (variants: Variant[]) => Promise<boolean>;
  isProcessing: boolean;
}

export default function ProductVariantsModal({
  isOpen,
  onClose,
  product,
  variants: initialVariants,
  onSave,
  isProcessing,
}: ProductVariantsModalProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Variant>({
    type: 'size',
    name: '',
    value: '',
    priceAdjustment: 0,
    stock: 0,
    sku: '',
    isDefault: false,
    displayOrder: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialVariants) {
      setVariants(initialVariants);
    } else {
      setVariants([]);
    }
    setEditingIndex(null);
    setFormData({
      type: 'size',
      name: '',
      value: '',
      priceAdjustment: 0,
      stock: 0,
      sku: '',
      isDefault: false,
      displayOrder: 0,
    });
    setErrors({});
  }, [initialVariants, isOpen]);

  const validateVariant = (variant: Variant): boolean => {
    const newErrors: Record<string, string> = {};

    if (!variant.type.trim()) {
      newErrors.type = 'กรุณาเลือกประเภท';
    }
    if (!variant.name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อ';
    }
    if (!variant.value.trim()) {
      newErrors.value = 'กรุณากรอกค่า';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddVariant = () => {
    if (!validateVariant(formData)) return;

    // If setting as default, unset other defaults of same type
    if (formData.isDefault) {
      setVariants(prev => prev.map(v => 
        v.type === formData.type ? { ...v, isDefault: false } : v
      ));
    }

    setVariants(prev => [...prev, { ...formData }]);
    setFormData({
      type: 'size',
      name: '',
      value: '',
      priceAdjustment: 0,
      stock: 0,
      sku: '',
      isDefault: false,
      displayOrder: variants.length,
    });
    setEditingIndex(null);
    setErrors({});
  };

  const handleEditVariant = (index: number) => {
    setEditingIndex(index);
    setFormData(variants[index]);
  };

  const handleUpdateVariant = () => {
    if (editingIndex === null || !validateVariant(formData)) return;

    // If setting as default, unset other defaults of same type
    if (formData.isDefault) {
      setVariants(prev => prev.map((v, i) => 
        i !== editingIndex && v.type === formData.type ? { ...v, isDefault: false } : v
      ));
    }

    setVariants(prev => prev.map((v, i) => 
      i === editingIndex ? formData : v
    ));
    setEditingIndex(null);
    setFormData({
      type: 'size',
      name: '',
      value: '',
      priceAdjustment: 0,
      stock: 0,
      sku: '',
      isDefault: false,
      displayOrder: variants.length,
    });
    setErrors({});
  };

  const handleDeleteVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setFormData({
      type: 'size',
      name: '',
      value: '',
      priceAdjustment: 0,
      stock: 0,
      sku: '',
      isDefault: false,
      displayOrder: variants.length,
    });
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!product) return;

    // Validate all variants
    const allValid = variants.every(v => validateVariant(v));
    if (!allValid) {
      return;
    }

    const success = await onSave(variants);
    if (success) {
      onClose();
    }
  };

  if (!product) return null;

  return (
    <AdminFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="จัดการ Variants"
      subtitle={product.nameThai || product.nameEnglish || 'Product'}
      size="4xl"
      onSubmit={handleSubmit}
      isProcessing={isProcessing}
      isFormValid={variants.length > 0}
      submitText="บันทึก Variants"
    >
      <div className="space-y-6">
        {/* Add/Edit Form */}
        <div className="bg-zinc-900 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold text-lg">
            {editingIndex !== null ? 'แก้ไข Variant' : 'เพิ่ม Variant ใหม่'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="ประเภท *"
              selectedKeys={[formData.type]}
              onSelectionChange={(keys) => {
                const type = Array.from(keys)[0] as string;
                setFormData({ ...formData, type, isDefault: false });
              }}
              isInvalid={!!errors.type}
              errorMessage={errors.type}
            >
              <SelectItem key="size">ขนาด (Size)</SelectItem>
              <SelectItem key="color">สี (Color)</SelectItem>
              <SelectItem key="material">วัสดุ (Material)</SelectItem>
              <SelectItem key="style">สไตล์ (Style)</SelectItem>
              <SelectItem key="other">อื่นๆ (Other)</SelectItem>
            </Select>

            <Input
              label="ชื่อ (Name) *"
              value={formData.name}
              onValueChange={(value) => setFormData({ ...formData, name: value })}
              isInvalid={!!errors.name}
              errorMessage={errors.name}
              placeholder="เช่น S, M, L หรือ Red, Blue"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="ค่า (Value) *"
              value={formData.value}
              onValueChange={(value) => setFormData({ ...formData, value: value })}
              isInvalid={!!errors.value}
              errorMessage={errors.value}
              placeholder="เช่น Small, Medium, Large"
            />

            <Input
              label="SKU"
              value={formData.sku || ''}
              onValueChange={(value) => setFormData({ ...formData, sku: value })}
              placeholder="รหัส SKU (ถ้ามี)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="ปรับราคา (฿)"
              type="number"
              value={formData.priceAdjustment.toString()}
              onValueChange={(value) => setFormData({ ...formData, priceAdjustment: parseFloat(value) || 0 })}
              startContent={<span className="text-zinc-400">฿</span>}
              placeholder="0"
            />

            <Input
              label="สต็อก"
              type="number"
              value={formData.stock.toString()}
              onValueChange={(value) => setFormData({ ...formData, stock: parseInt(value) || 0 })}
              min="0"
            />

            <Input
              label="ลำดับการแสดง"
              type="number"
              value={formData.displayOrder.toString()}
              onValueChange={(value) => setFormData({ ...formData, displayOrder: parseInt(value) || 0 })}
              min="0"
            />
          </div>

          <Switch
            isSelected={formData.isDefault}
            onValueChange={(value) => setFormData({ ...formData, isDefault: value })}
          >
            เป็นค่าเริ่มต้น (Default)
          </Switch>

          <div className="flex gap-2">
            {editingIndex !== null ? (
              <>
                <Button
                  color="primary"
                  onPress={handleUpdateVariant}
                  startContent={<PencilIcon className="w-4 h-4" />}
                >
                  อัปเดต
                </Button>
                <Button
                  variant="light"
                  onPress={handleCancelEdit}
                >
                  ยกเลิก
                </Button>
              </>
            ) : (
              <Button
                color="primary"
                onPress={handleAddVariant}
                startContent={<PlusIcon className="w-4 h-4" />}
              >
                เพิ่ม Variant
              </Button>
            )}
          </div>
        </div>

        {/* Variants List */}
        <div>
          <h3 className="font-semibold text-lg mb-4">
            Variants ที่มี ({variants.length})
          </h3>

          {variants.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              ยังไม่มี Variants กรุณาเพิ่ม Variant
            </div>
          ) : (
            <div className="space-y-2">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="bg-zinc-900 p-4 rounded-lg flex items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Chip variant="flat" size="sm">
                        {variant.type}
                      </Chip>
                      <span className="font-semibold">{variant.name}</span>
                      <span className="text-zinc-400">({variant.value})</span>
                      {variant.isDefault && (
                        <Chip color="primary" variant="flat" size="sm">
                          Default
                        </Chip>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <span>ราคา: ฿{(variant.priceAdjustment || 0) >= 0 ? '+' : ''}{(variant.priceAdjustment || 0).toLocaleString()}</span>
                      <span>สต็อก: {variant.stock || 0} ชิ้น</span>
                      {variant.sku && <span>SKU: {variant.sku}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleEditVariant(index)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleDeleteVariant(index)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminFormModal>
  );
}

