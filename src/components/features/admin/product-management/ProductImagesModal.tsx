import { useState, useEffect } from 'react';
import { Button, Input } from '@heroui/react';
import { PlusIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import AdminFormModal from '../shared/AdminFormModal';

interface ProductImage {
  id?: string;
  imageUrl: string;
  altText?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

interface ProductImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    nameThai?: string | null;
    nameEnglish?: string | null;
  } | null;
  images: ProductImage[];
  onSave: (images: ProductImage[]) => Promise<boolean>;
  isProcessing: boolean;
}

export default function ProductImagesModal({
  isOpen,
  onClose,
  product,
  images: initialImages,
  onSave,
  isProcessing,
}: ProductImagesModalProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');

  useEffect(() => {
    if (initialImages) {
      setImages(initialImages);
    } else {
      setImages([]);
    }
    setNewImageUrl('');
    setNewImageAlt('');
  }, [initialImages, isOpen]);

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;

    const newImage: ProductImage = {
      imageUrl: newImageUrl.trim(),
      altText: newImageAlt.trim() || undefined,
      isPrimary: images.length === 0, // First image is primary by default
      displayOrder: images.length,
    };

    setImages(prev => [...prev, newImage]);
    setNewImageUrl('');
    setNewImageAlt('');
  };

  const handleDeleteImage = (index: number) => {
    const deletedImage = images[index];
    const newImages = images.filter((_, i) => i !== index);
    
    // If deleted image was primary, make first image primary
    if (deletedImage.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }

    setImages(newImages);
  };

  const handleSetPrimary = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    })));
  };

  const handleReorder = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === images.length - 1) return;

    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    
    // Update display orders
    newImages.forEach((img, i) => {
      img.displayOrder = i;
    });

    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (!product) return;

    const success = await onSave(images);
    if (success) {
      onClose();
    }
  };

  if (!product) return null;

  return (
    <AdminFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="จัดการรูปภาพสินค้า"
      subtitle={product.nameThai || product.nameEnglish || 'Product'}
      size="4xl"
      onSubmit={handleSubmit}
      isProcessing={isProcessing}
      isFormValid={true}
      submitText="บันทึกรูปภาพ"
    >
      <div className="space-y-6">
        {/* Add Image Form */}
        <div className="bg-zinc-900 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold text-lg">เพิ่มรูปภาพใหม่</h3>
          
          <div className="space-y-3">
            <Input
              label="URL รูปภาพ *"
              value={newImageUrl}
              onValueChange={setNewImageUrl}
              placeholder="https://example.com/image.jpg"
              isRequired
            />
            <Input
              label="Alt Text"
              value={newImageAlt}
              onValueChange={setNewImageAlt}
              placeholder="คำอธิบายรูปภาพ"
            />
            <Button
              color="primary"
              onPress={handleAddImage}
              startContent={<PlusIcon className="w-4 h-4" />}
              isDisabled={!newImageUrl.trim()}
            >
              เพิ่มรูปภาพ
            </Button>
          </div>
        </div>

        {/* Images List */}
        <div>
          <h3 className="font-semibold text-lg mb-4">
            รูปภาพ ({images.length})
          </h3>

          {images.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 border border-zinc-700 rounded-lg">
              <PhotoIcon className="mx-auto mb-4 w-12 h-12 text-zinc-600" />
              <p>ยังไม่มีรูปภาพ</p>
              <p className="text-sm mt-2">กรุณาเพิ่มรูปภาพโดยกรอก URL</p>
            </div>
          ) : (
            <div className="space-y-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="bg-zinc-900 p-4 rounded-lg flex items-start gap-4"
                >
                  {/* Image Preview */}
                  <div className="relative w-24 h-24 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={image.imageUrl}
                      alt={image.altText || `Image ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/assets/images/fallback-img.jpg';
                      }}
                    />
                    {image.isPrimary && (
                      <div className="top-1 right-1 absolute bg-primary px-2 py-1 rounded text-xs font-semibold">
                        Primary
                      </div>
                    )}
                  </div>

                  {/* Image Info */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="font-semibold text-sm mb-1">URL</p>
                      <p className="text-zinc-400 text-xs break-all">{image.imageUrl}</p>
                    </div>
                    {image.altText && (
                      <div>
                        <p className="font-semibold text-sm mb-1">Alt Text</p>
                        <p className="text-zinc-400 text-xs">{image.altText}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-xs">
                        ลำดับ: {image.displayOrder || index}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant={image.isPrimary ? 'solid' : 'flat'}
                      color={image.isPrimary ? 'primary' : 'default'}
                      onPress={() => handleSetPrimary(index)}
                      isDisabled={image.isPrimary}
                    >
                      {image.isPrimary ? 'Primary' : 'Set Primary'}
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        onPress={() => handleReorder(index, 'up')}
                        isDisabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        onPress={() => handleReorder(index, 'down')}
                        isDisabled={index === images.length - 1}
                      >
                        ↓
                      </Button>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color="danger"
                      onPress={() => handleDeleteImage(index)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 p-4 border-blue-500 border rounded-lg">
          <p className="text-blue-400 text-sm">
            <strong>หมายเหตุ:</strong> รูปภาพแรกจะเป็น Primary Image โดยอัตโนมัติ
            คุณสามารถเปลี่ยน Primary Image ได้โดยกดปุ่ม &quot;Set Primary&quot;
          </p>
        </div>
      </div>
    </AdminFormModal>
  );
}

