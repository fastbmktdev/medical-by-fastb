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
  Checkbox,
} from '@heroui/react';
import {
  TrashIcon,
  PencilIcon,
  StarIcon,
  ArrowsUpDownIcon,
  Squares2X2Icon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
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
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  selectionMode: boolean;
}

function SortableImage({
  image,
  onEdit,
  onDelete,
  onSetFeatured,
  isSelected,
  onSelect,
  selectionMode,
}: SortableImageProps) {
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
      <Card className={`relative overflow-hidden ${isSelected ? 'ring-2 ring-primary-500' : ''}`}>
        <CardBody className="p-0">
          <div className="relative aspect-square">
            <Image
              src={image.image_url}
              alt={image.alt_text || image.title || 'Gallery image'}
              fill
              className="object-cover"
            />

            {/* Selection Checkbox */}
            {selectionMode && (
              <div className="absolute left-2 top-2 z-10">
                <Checkbox
                  isSelected={isSelected}
                  onValueChange={(checked) => onSelect(image.id, checked)}
                  classNames={{
                    wrapper: 'bg-white/90',
                  }}
                />
              </div>
            )}

            {/* Featured badge */}
            {image.is_featured && !selectionMode && (
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

            {/* Drag handle - hide in selection mode */}
            {!selectionMode && (
              <button
                {...listeners}
                className="absolute right-2 top-2 cursor-move  bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
              >
                <ArrowsUpDownIcon className="h-4 w-4" />
              </button>
            )}

            {/* Actions overlay - hide in selection mode */}
            {!selectionMode && (
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
            )}

            {/* Image info */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3 pt-8">
              {image.title && (
                <p className="truncate text-sm font-semibold text-white">
                  {image.title}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-white/70">
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

export function GalleryManagerBulk({ hospitalId, onRefresh }: GalleryManagerProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAltText, setEditAltText] = useState('');
  
  // Bulk selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);

  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const bulkDeleteModal = useDisclosure();

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

  // Bulk selection handlers
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredImages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredImages.map(img => img.id)));
    }
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setFilterFeatured(null);
  };

  const handleSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      setProcessing(true);
      const deletePromises = Array.from(selectedIds).map(imageId =>
        fetch(`/api/partner/gallery/${imageId}`, {
          method: 'DELETE',
        })
      );

      const results = await Promise.all(deletePromises);
      const successful = results.filter(r => r.ok).length;
      const failed = results.length - successful;

      if (failed === 0) {
        toast.success(`Successfully deleted ${successful} image(s)`);
      } else {
        toast.error(`Deleted ${successful}, failed ${failed}`);
      }

      bulkDeleteModal.onClose();
      setSelectedIds(new Set());
      setSelectionMode(false);
      loadGallery();
      onRefresh?.();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete images');
    } finally {
      setProcessing(false);
    }
  };

  // Single image handlers
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

  // Filter and search images
  const filteredImages = images.filter(image => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = image.title?.toLowerCase().includes(query);
      const matchesDescription = image.description?.toLowerCase().includes(query);
      const matchesAltText = image.alt_text?.toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesDescription && !matchesAltText) {
        return false;
      }
    }
    
    // Featured filter
    if (filterFeatured !== null) {
      if (image.is_featured !== filterFeatured) {
        return false;
      }
    }
    
    return true;
  });
  
  const selectedCount = selectedIds.size;
  const allSelected = selectedCount === filteredImages.length && filteredImages.length > 0;

  return (
    <>
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search by title, description, or alt text..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<MagnifyingGlassIcon className="h-4 w-4 text-default-400" />}
              isClearable
              onClear={() => setSearchQuery('')}
              classNames={{
                input: "text-sm",
                inputWrapper: "h-10",
              }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={showFilterOptions ? 'solid' : 'flat'}
              color={showFilterOptions ? 'primary' : 'default'}
              onPress={() => setShowFilterOptions(!showFilterOptions)}
              startContent={<FunnelIcon className="h-4 w-4" />}
            >
              Filters
            </Button>
            
            {(searchQuery || filterFeatured !== null) && (
              <Chip
                onClose={clearFilters}
                variant="flat"
                color="warning"
                size="sm"
              >
                {filteredImages.length} of {images.length}
              </Chip>
            )}
          </div>
        </div>
        
        {/* Filter Options */}
        {showFilterOptions && (
          <Card>
            <CardBody className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold text-default-700">Filter by:</p>
                <Button
                  size="sm"
                  variant={filterFeatured === true ? 'solid' : 'flat'}
                  color={filterFeatured === true ? 'warning' : 'default'}
                  onPress={() => setFilterFeatured(filterFeatured === true ? null : true)}
                  startContent={<StarIcon className="h-3 w-3" />}
                >
                  Featured Only
                </Button>
                <Button
                  size="sm"
                  variant={filterFeatured === false ? 'solid' : 'flat'}
                  color={filterFeatured === false ? 'primary' : 'default'}
                  onPress={() => setFilterFeatured(filterFeatured === false ? null : false)}
                >
                  Not Featured
                </Button>
                {(searchQuery || filterFeatured !== null) && (
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={clearFilters}
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-lg text-default-900">
                Gallery Images 
                {filteredImages.length !== images.length && (
                  <span className="ml-2 text-sm font-normal text-default-500">
                    ({filteredImages.length} of {images.length})
                  </span>
                )}
                {filteredImages.length === images.length && (
                  <span className="ml-2 text-sm font-normal text-default-500">
                    ({images.length})
                  </span>
                )}
              </p>
              {!selectionMode && (
                <p className="text-sm text-default-500">
                  Drag to reorder • Click star to set featured
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <>
                <Chip color="primary" variant="flat">
                  {selectedCount} selected
                </Chip>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={toggleSelectAll}
                  startContent={<CheckCircleIcon className="h-4 w-4" />}
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  isDisabled={selectedCount === 0}
                  onPress={bulkDeleteModal.onOpen}
                  startContent={<TrashIcon className="h-4 w-4" />}
                >
                  Delete ({selectedCount})
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  onPress={toggleSelectionMode}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  onPress={toggleSelectionMode}
                  startContent={<Squares2X2Icon className="h-4 w-4" />}
                >
                  Select
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={loadGallery}
                  isDisabled={processing}
                >
                  Refresh
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredImages.length === 0 ? (
          <Card className="border-2 border-dashed border-default-300">
            <CardBody className="py-12 text-center">
              <MagnifyingGlassIcon className="mx-auto mb-3 h-12 w-12 text-default-400" />
              <p className="text-default-600 font-semibold">No images found</p>
              <p className="mt-1 text-sm text-default-400">
                {searchQuery || filterFeatured !== null
                  ? 'Try adjusting your search or filters'
                  : 'Upload some images to get started'}
              </p>
              {(searchQuery || filterFeatured !== null) && (
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  className="mt-4"
                  onPress={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </CardBody>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredImages.map((img) => img.id)}
              strategy={rectSortingStrategy}
              disabled={selectionMode || searchQuery !== '' || filterFeatured !== null}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filteredImages.map((image) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSetFeatured={handleSetFeatured}
                    isSelected={selectedIds.has(image.id)}
                    onSelect={handleSelect}
                    selectionMode={selectionMode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
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

      {/* Single Delete Confirmation Modal */}
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

      {/* Bulk Delete Confirmation Modal */}
      <Modal isOpen={bulkDeleteModal.isOpen} onClose={bulkDeleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Multiple Images</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete <strong>{selectedCount}</strong> image(s)? 
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={bulkDeleteModal.onClose} isDisabled={processing}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleBulkDelete} isLoading={processing}>
              Delete {selectedCount} Image{selectedCount > 1 ? 's' : ''}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

