"use client";

import { useState, useMemo, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Select, SelectItem } from '@heroui/react';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { Article } from '@/types';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface ArticleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  article: Article;
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

export default function ArticleEditModal({ isOpen, onClose, onSuccess, article }: ArticleEditModalProps) {
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
    date: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_image: '',
    og_title: '',
    og_description: '',
    canonical_url: '',
    scheduled_publish_at: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        slug: article.slug || '',
        excerpt: article.excerpt || '',
        content: article.content || '',
        category: article.category || '',
        tags: article.tags?.join(', ') || '',
        image: article.image || '',
        is_new: article.is_new || false,
        date: article.date || '',
        meta_title: article.meta_title || '',
        meta_description: article.meta_description || '',
        meta_keywords: article.meta_keywords?.join(', ') || '',
        og_image: article.og_image || '',
        og_title: article.og_title || '',
        og_description: article.og_description || '',
        canonical_url: article.canonical_url || '',
        scheduled_publish_at: article.scheduled_publish_at 
          ? new Date(article.scheduled_publish_at).toISOString().slice(0, 16)
          : '',
      });
    }
  }, [article]);

  const handleSubmit = async () => {
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

      if (formData.meta_title) payload.meta_title = formData.meta_title;
      if (formData.meta_description) payload.meta_description = formData.meta_description;
      if (metaKeywordsArray.length > 0) payload.meta_keywords = metaKeywordsArray;
      if (formData.og_image) payload.og_image = formData.og_image;
      if (formData.og_title) payload.og_title = formData.og_title;
      if (formData.og_description) payload.og_description = formData.og_description;
      if (formData.canonical_url) payload.canonical_url = formData.canonical_url;
      if (formData.scheduled_publish_at) {
        payload.scheduled_publish_at = new Date(formData.scheduled_publish_at).toISOString();
      }

      const response = await fetch(`/api/articles/${article.id}-admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('แก้ไขบทความสำเร็จ');
        onSuccess();
        handleClose();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
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
        <ModalHeader className="flex flex-col gap-1">แก้ไขบทความ</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="ชื่อบทความ"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              isRequired
            />
            <Input
              label="Slug"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              isRequired
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="หมวดหมู่"
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
              value={formData.excerpt}
              onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
              minRows={2}
              isRequired
            />
            <Input
              label="รูปภาพหลัก (URL)"
              value={formData.image}
              onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
            />
            <Input
              label="แท็ก (คั่นด้วย comma)"
              value={formData.tags}
              onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium mb-2">เนื้อหาบทความ</label>
              <div className="bg-white text-black rounded-lg">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
                  modules={quillModules}
                  className="min-h-[300px]"
                />
              </div>
            </div>
            <Button
              variant="light"
              size="sm"
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'ซ่อน' : 'แสดง'} ตัวเลือกขั้นสูง
            </Button>
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
                <h3 className="font-semibold text-lg mt-4">Scheduling</h3>
                <Input
                  type="datetime-local"
                  label="กำหนดเวลาเผยแพร่"
                  value={formData.scheduled_publish_at}
                  onChange={(e) => setFormData((prev) => ({ ...prev, scheduled_publish_at: e.target.value }))}
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
            บันทึก
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
