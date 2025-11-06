"use client";

import { useState, useMemo } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Select, SelectItem, Chip, useDisclosure } from '@heroui/react';
import MediaLibraryModal from '@/components/features/admin/article-management/MediaLibraryModal';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import Image from 'next/image';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface ArticleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const categories = [
  'ประวัติศาสตร์',
  'เทคนิค',
  'สุขภาพ',
  'บุคคล',
  'อุปกรณ์',
  'โภชนาการ',
  'ข่าวสาร',
  'อื่นๆ',
];

export default function ArticleCreateModal({ isOpen, onClose, onSuccess }: ArticleCreateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    image: '',
    is_new: false,
    date: new Date().toISOString().split('T')[0],
    // SEO fields
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_image: '',
    og_title: '',
    og_description: '',
    canonical_url: '',
    // Scheduling
    scheduled_publish_at: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const mediaLibraryModal = useDisclosure();

  // Generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      meta_title: prev.meta_title || title,
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title || !formData.slug || !formData.excerpt || !formData.content || !formData.category) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const metaKeywordsArray = formData.meta_keywords
        ? formData.meta_keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : [];

      const payload: any = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        tags: tagsArray,
        image: formData.image || null,
        is_new: formData.is_new,
        date: formData.date,
      };

      // Add SEO fields if provided
      if (formData.meta_title) payload.meta_title = formData.meta_title;
      if (formData.meta_description) payload.meta_description = formData.meta_description;
      if (metaKeywordsArray.length > 0) payload.meta_keywords = metaKeywordsArray;
      if (formData.og_image) payload.og_image = formData.og_image;
      if (formData.og_title) payload.og_title = formData.og_title;
      if (formData.og_description) payload.og_description = formData.og_description;
      if (formData.canonical_url) payload.canonical_url = formData.canonical_url;

      // Add scheduling if provided
      if (formData.scheduled_publish_at) {
        payload.scheduled_publish_at = new Date(formData.scheduled_publish_at).toISOString();
      }

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('สร้างบทความสำเร็จ');
        onSuccess();
        handleClose();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      tags: '',
      image: '',
      is_new: false,
      date: new Date().toISOString().split('T')[0],
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      og_image: '',
      og_title: '',
      og_description: '',
      canonical_url: '',
      scheduled_publish_at: '',
    });
    setShowAdvanced(false);
    onClose();
  };

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['link', 'image'],
        [{ align: [] }],
        ['clean'],
      ],
    }),
    []
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="5xl"
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
        <ModalHeader className="flex flex-col gap-1">สร้างบทความใหม่</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Basic Fields */}
            <Input
              label="ชื่อบทความ"
              placeholder="กรอกชื่อบทความ"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              isRequired
            />
            <Input
              label="Slug"
              placeholder="url-friendly-slug"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              description="URL-friendly identifier (auto-generated from title)"
              isRequired
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="หมวดหมู่"
                placeholder="เลือกหมวดหมู่"
                selectedKeys={formData.category ? [formData.category] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setFormData((prev) => ({ ...prev, category: value }));
                }}
                isRequired
              >
                {categories.map((cat) => (
                  <SelectItem key={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </Select>
              <Input
                type="date"
                label="วันที่"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                isRequired
              />
            </div>
            <Textarea
              label="คำอธิบายสั้นๆ"
              placeholder="กรอกคำอธิบายสั้นๆ ของบทความ"
              value={formData.excerpt}
              onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
              minRows={2}
              isRequired
            />
            <div>
              <Input
                label="รูปภาพหลัก (URL)"
                placeholder="https://example.com/image.jpg"
                value={formData.image}
                onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                endContent={
                  <Button
                    size="sm"
                    variant="light"
                    onPress={mediaLibraryModal.onOpen}
                    className="min-w-fit"
                  >
                    เลือกจาก Media Library
                  </Button>
                }
              />
              {formData.image && (
                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden">
                  <Image
                    width={300}
                    height={300}
                    fill
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <Input
              label="แท็ก (คั่นด้วย comma)"
              placeholder="มวยไทย, เทคนิค, การฝึก"
              value={formData.tags}
              onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
            />

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium mb-2">เนื้อหาบทความ</label>
              <div className="bg-white text-black rounded-lg">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
                  modules={quillModules}
                  placeholder="เขียนเนื้อหาบทความที่นี่..."
                  className="min-h-[300px]"
                />
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <Button
              variant="light"
              size="sm"
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'ซ่อน' : 'แสดง'} ตัวเลือกขั้นสูง (SEO, Scheduling)
            </Button>

            {/* Advanced Fields */}
            {showAdvanced && (
              <div className="space-y-4 pt-4 border-t border-zinc-700">
                <h3 className="font-semibold text-lg">SEO Settings</h3>
                <Input
                  label="Meta Title"
                  placeholder="SEO title (defaults to article title)"
                  value={formData.meta_title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, meta_title: e.target.value }))}
                />
                <Textarea
                  label="Meta Description"
                  placeholder="SEO description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, meta_description: e.target.value }))}
                  minRows={2}
                />
                <Input
                  label="Meta Keywords (คั่นด้วย comma)"
                  placeholder="keyword1, keyword2, keyword3"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData((prev) => ({ ...prev, meta_keywords: e.target.value }))}
                />
                <Input
                  label="OG Image URL"
                  placeholder="https://example.com/og-image.jpg"
                  value={formData.og_image}
                  onChange={(e) => setFormData((prev) => ({ ...prev, og_image: e.target.value }))}
                />
                <Input
                  label="OG Title"
                  placeholder="Open Graph title"
                  value={formData.og_title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, og_title: e.target.value }))}
                />
                <Textarea
                  label="OG Description"
                  placeholder="Open Graph description"
                  value={formData.og_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, og_description: e.target.value }))}
                  minRows={2}
                />
                <Input
                  label="Canonical URL"
                  placeholder="https://example.com/article"
                  value={formData.canonical_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, canonical_url: e.target.value }))}
                />

                <h3 className="font-semibold text-lg mt-4">Content Scheduling</h3>
                <Input
                  type="datetime-local"
                  label="กำหนดเวลาเผยแพร่"
                  placeholder="Schedule publish time"
                  value={formData.scheduled_publish_at}
                  onChange={(e) => setFormData((prev) => ({ ...prev, scheduled_publish_at: e.target.value }))}
                  description="ปล่อยว่างไว้หากต้องการเผยแพร่ทันที"
                />
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={handleClose}>
            ยกเลิก
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting}>
            สร้างบทความ
          </Button>
        </ModalFooter>
      </ModalContent>
      
      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={mediaLibraryModal.isOpen}
        onClose={mediaLibraryModal.onClose}
        onSelect={(url) => {
          setFormData((prev) => ({ ...prev, image: url }));
          mediaLibraryModal.onClose();
        }}
      />
    </Modal>
  );
}
