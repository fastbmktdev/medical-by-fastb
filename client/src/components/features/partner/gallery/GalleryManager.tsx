'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardBody,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Textarea,
  Chip,
  Spinner,
} from '@heroui/react';
import {
  TrashIcon,
  PencilIcon,
  StarIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import type { GalleryImage } from '@shared/types/gallery.types';
import { formatFileSize } from '@shared/lib/utils/imageOptimization';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface GalleryManagerProps {
  hospitalId: string;
  onRefresh?: () => void;
}

interface SortableImageProps {
  image: GalleryImage;
  onEdit: (image: GalleryImage) => void;
  onDelete: (image: GalleryImage) => void;
  onSetFeatured: (image: GalleryImage) => void;
}

function SortableImage({ image, onEdit, onDelete, onSetFeatured }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="relative overflow-hidden">
        <CardBody className="p-0">
          <div className="relative aspect-square">
            <Image
              src={image.image_url}
              alt={image.alt_text || image.title || 'Gallery image'}
              fill
              className="object-cover"
            />

            {/* Featured badge */}
            {image.is_featured && (
              <div className="absolute left-2 top-2">
                <Chip
                  startContent={<StarIconSolid className="h-3 w-3" />}
                  size="sm"
                  color="warning"
                  variant="solid"
                >
                  Featured
                </Chip>
              </div>
            )}

            {/* Drag handle */}
            <button
              {...listeners}
              className="absolute right-2 top-2 cursor-move  bg-black/60 p-2 text-zinc-950 transition-colors hover:bg-black/80"
            >
              <ArrowsUpDownIcon className="h-4 w-4" />
            </button>

            {/* Actions overlay */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all hover:bg-black/50 hover:opacity-100">
              <Button
                isIconOnly
                size="sm"
                color="warning"
                variant="solid"
                onPress={() => onSetFeatured(image)}
                title="Set as featured"
              >
                <StarIcon className="h-4 w-4" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="primary"
                variant="solid"
                onPress={() => onEdit(image)}
                title="Edit details"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                onPress={() => onDelete(image)}
                title="Delete image"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Image info */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3 pt-8">
              {image.title && (
                <p className="truncate text-sm font-semibold text-zinc-950">
                  {image.title}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-950/70">
                {image.width && image.height && (
                  <span>
                    {image.width}×{image.height}
                  </span>
                )}
                {image.file_size && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(image.file_size)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export function GalleryManager({ hospitalId, onRefresh }: GalleryManagerProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAltText, setEditAltText] = useState('');

  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadGallery = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/partner/gallery?hospital_id=${hospitalId}`);
      const result = await response.json();

      if (result.success) {
        setImages(result.data.images || []);
      } else {
        toast.error('Failed to load gallery');
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      setImages(newImages);

      // Update display orders
      const imageOrders = newImages.map((img, index) => ({
        id: img.id,
        display_order: index + 1,
      }));

      try {
        const response = await fetch('/api/partner/gallery/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hospital_id: hospitalId,
            image_orders: imageOrders,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to reorder images');
        }

        toast.success('Gallery order updated');
      } catch (error) {
        console.error('Error reordering:', error);
        toast.error('Failed to update order');
        loadGallery(); // Reload to reset
      }
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setSelectedImage(image);
    setEditTitle(image.title || '');
    setEditDescription(image.description || '');
    setEditAltText(image.alt_text || '');
    editModal.onOpen();
  };

  const handleSaveEdit = async () => {
    if (!selectedImage) return;

    try {
      setProcessing(true);
      const response = await fetch(`/api/partner/gallery/${selectedImage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          alt_text: editAltText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update image');
      }

      toast.success('Image updated successfully');
      editModal.onClose();
      loadGallery();
      onRefresh?.();
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('Failed to update image');
    } finally {
      setProcessing(false);
    }
  };

  const handleSetFeatured = async (image: GalleryImage) => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/partner/gallery/${image.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_featured: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set featured image');
      }

      toast.success('Featured image updated');
      loadGallery();
      onRefresh?.();
    } catch (error) {
      console.error('Error setting featured:', error);
      toast.error('Failed to set featured image');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = (image: GalleryImage) => {
    setSelectedImage(image);
    deleteModal.onOpen();
  };

  const handleConfirmDelete = async () => {
    if (!selectedImage) return;

    try {
      setProcessing(true);
      const response = await fetch(`/api/partner/gallery/${selectedImage.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      toast.success('Image deleted successfully');
      deleteModal.onClose();
      loadGallery();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <Card className="border-2 border-dashed border-default-300">
        <CardBody className="py-12 text-center">
          <p className="text-default-500">
            No images in gallery yet. Upload some images to get started!
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-lg text-default-900">
              Gallery Images ({images.length})
            </p>
            <p className="text-sm text-default-500">
              Drag to reorder • Click star to set featured
            </p>
          </div>
          <Button
            size="sm"
            variant="flat"
            onPress={loadGallery}
            isDisabled={processing}
          >
            Refresh
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((image) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSetFeatured={handleSetFeatured}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Edit Image Details</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {selectedImage && (
                <div className="relative aspect-video overflow-hidden ">
                  <Image
                    src={selectedImage.image_url}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <Input
                label="Title"
                placeholder="Enter image title"
                value={editTitle}
                onValueChange={setEditTitle}
              />

              <Textarea
                label="Description"
                placeholder="Enter image description"
                value={editDescription}
                onValueChange={setEditDescription}
                minRows={3}
              />

              <Input
                label="Alt Text"
                placeholder="Describe the image for accessibility"
                value={editAltText}
                onValueChange={setEditAltText}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={editModal.onClose} isDisabled={processing}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSaveEdit} isLoading={processing}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Image</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete this image? This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={deleteModal.onClose} isDisabled={processing}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleConfirmDelete} isLoading={processing}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

