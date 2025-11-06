import { Button, Chip } from '@heroui/react';
import { PencilIcon, TrashIcon, CubeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import AdminDetailModal from '../shared/AdminDetailModal';
import AdminInfoSection from '../shared/AdminInfoSection';

interface Product {
  id: string;
  slug: string;
  nameThai?: string | null;
  nameEnglish?: string | null;
  description?: string | null;
  price: number;
  stock: number;
  category?: {
    id: string;
    nameThai?: string | null;
    nameEnglish?: string | null;
  } | null;
  image?: string | null;
  images?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  viewsCount?: number;
  salesCount?: number;
  sku?: string | null;
  weightKg?: number | null;
  dimensions?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  isProcessing: boolean;
}

export default function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onEdit,
  onDelete,
  isProcessing,
}: ProductDetailModalProps) {
  if (!product) return null;

  const footer = (
    <div className="flex flex-wrap gap-2 w-full">
      <Button
        color="secondary"
        variant="flat"
        onPress={() => {
          onEdit(product);
          onClose();
        }}
        isDisabled={isProcessing}
        startContent={<PencilIcon className="w-4 h-4" />}
      >
        แก้ไข
      </Button>
      <Button
        color="danger"
        variant="flat"
        onPress={() => {
          onDelete(product);
          onClose();
        }}
        isDisabled={isProcessing}
        startContent={<TrashIcon className="w-4 h-4" />}
      >
        ลบ
      </Button>
      <div className="flex-1" />
    </div>
  );

  return (
    <AdminDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title="รายละเอียดสินค้า"
      subtitle={product.nameThai || product.nameEnglish || 'Product'}
      size="3xl"
      actions={footer}
      isProcessing={isProcessing}
    >
      <div className="space-y-6">
        {/* Product Image */}
        {product.image && (
          <div className="relative w-full h-64 bg-zinc-800 rounded-lg overflow-hidden">
            <Image
              src={product.image}
              alt={product.nameThai || product.nameEnglish || 'Product'}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Basic Information */}
        <AdminInfoSection title="ข้อมูลพื้นฐาน">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-zinc-400 text-sm mb-1">ชื่อไทย</p>
              <p className="font-semibold">{product.nameThai || '-'}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">ชื่ออังกฤษ</p>
              <p className="font-semibold">{product.nameEnglish || '-'}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">Slug</p>
              <p className="font-mono text-sm">{product.slug}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">SKU</p>
              <p className="font-mono text-sm">{product.sku || '-'}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">หมวดหมู่</p>
              {product.category ? (
                <Chip variant="flat" size="sm">
                  {product.category.nameThai || product.category.nameEnglish}
                </Chip>
              ) : (
                <p>-</p>
              )}
            </div>
          </div>
        </AdminInfoSection>

        {/* Pricing & Stock */}
        <AdminInfoSection title="ราคาและสต็อก">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-zinc-400 text-sm mb-1">ราคา</p>
              <p className="font-bold text-red-500 text-xl">฿{(product.price || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">สต็อก</p>
              <Chip
                color={(product.stock || 0) === 0 ? 'danger' : (product.stock || 0) < 10 ? 'warning' : 'success'}
                variant="flat"
              >
                {product.stock || 0} ชิ้น
              </Chip>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">สถานะ</p>
              <div className="flex flex-col gap-1">
                <Chip
                  color={product.isActive !== false ? 'success' : 'danger'}
                  variant="flat"
                  size="sm"
                >
                  {product.isActive !== false ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </Chip>
                {product.isFeatured && (
                  <Chip color="warning" variant="flat" size="sm">
                    สินค้าแนะนำ
                  </Chip>
                )}
              </div>
            </div>
          </div>
        </AdminInfoSection>

        {/* Description */}
        {product.description && (
          <AdminInfoSection title="รายละเอียดสินค้า">
            <p className="text-zinc-300 whitespace-pre-line">{product.description}</p>
          </AdminInfoSection>
        )}

        {/* Product Details */}
        {(product.weightKg || product.dimensions) && (
          <AdminInfoSection title="ข้อมูลสินค้า">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.weightKg && (
                <div>
                  <p className="text-zinc-400 text-sm mb-1">น้ำหนัก</p>
                  <p>{product.weightKg} กิโลกรัม</p>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <p className="text-zinc-400 text-sm mb-1">ขนาด</p>
                  <p>{product.dimensions}</p>
                </div>
              )}
            </div>
          </AdminInfoSection>
        )}

        {/* Statistics */}
        <AdminInfoSection title="สถิติ">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-zinc-400 text-sm mb-1">จำนวนการดู</p>
              <p className="font-semibold">{product.viewsCount || 0}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">จำนวนการขาย</p>
              <p className="font-semibold">{product.salesCount || 0}</p>
            </div>
            {product.createdAt && (
              <div>
                <p className="text-zinc-400 text-sm mb-1">สร้างเมื่อ</p>
                <p className="text-sm">{new Date(product.createdAt).toLocaleString('th-TH')}</p>
              </div>
            )}
            {product.updatedAt && (
              <div>
                <p className="text-zinc-400 text-sm mb-1">อัปเดตล่าสุด</p>
                <p className="text-sm">{new Date(product.updatedAt).toLocaleString('th-TH')}</p>
              </div>
            )}
          </div>
        </AdminInfoSection>
      </div>
    </AdminDetailModal>
  );
}

