"use client";

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Switch } from '@heroui/react';
import { toast } from 'react-hot-toast';

interface PromotionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PromotionCreateModal({ isOpen, onClose, onSuccess }: PromotionCreateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    titleEnglish: '',
    description: '',
    isActive: true,
    priority: 0,
    showInMarquee: true,
    startDate: '',
    endDate: '',
    linkUrl: '',
    linkText: '',
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('กรุณากรอกชื่อโปรโมชั่น');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: formData.title.trim(),
        isActive: formData.isActive,
        priority: parseInt(formData.priority.toString()) || 0,
        showInMarquee: formData.showInMarquee,
      };

      if (formData.titleEnglish) payload.titleEnglish = formData.titleEnglish.trim();
      if (formData.description) payload.description = formData.description.trim();
      if (formData.startDate) payload.startDate = new Date(formData.startDate).toISOString();
      if (formData.endDate) payload.endDate = new Date(formData.endDate).toISOString();
      if (formData.linkUrl) payload.linkUrl = formData.linkUrl.trim();
      if (formData.linkText) payload.linkText = formData.linkText.trim();

      const response = await fetch('/api/partner/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('สร้างโปรโมชั่นสำเร็จ');
        onSuccess();
        handleClose();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      titleEnglish: '',
      description: '',
      isActive: true,
      priority: 0,
      showInMarquee: true,
      startDate: '',
      endDate: '',
      linkUrl: '',
      linkText: '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="3xl"
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
        <ModalHeader className="flex flex-col gap-1">สร้างโปรโมชั่นใหม่</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="ชื่อโปรโมชั่น (ไทย)"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              isRequired
              placeholder="เช่น: โปรโมชั่นพิเศษ ลดราคา 20%"
            />
            <Input
              label="ชื่อโปรโมชั่น (อังกฤษ)"
              value={formData.titleEnglish}
              onChange={(e) => setFormData((prev) => ({ ...prev, titleEnglish: e.target.value }))}
              placeholder="Optional - เช่น: Special Promotion 20% Off"
            />
            <Textarea
              label="คำอธิบาย"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              minRows={3}
              placeholder="รายละเอียดโปรโมชั่น (Optional)"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="datetime-local"
                label="วันที่เริ่มต้น"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                placeholder="Optional"
              />
              <Input
                type="datetime-local"
                label="วันที่สิ้นสุด"
                value={formData.endDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Priority"
                value={formData.priority.toString()}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                description="ตัวเลขสูงกว่า = แสดงก่อน (Default: 0)"
              />
              <div className="flex flex-col gap-2">
                <Switch
                  isSelected={formData.isActive}
                  onValueChange={(isActive) => setFormData((prev) => ({ ...prev, isActive }))}
                >
                  เปิดใช้งานทันที
                </Switch>
                <Switch
                  isSelected={formData.showInMarquee}
                  onValueChange={(showInMarquee) => setFormData((prev) => ({ ...prev, showInMarquee }))}
                >
                  แสดงใน Marquee
                </Switch>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="ลิงก์ URL"
                value={formData.linkUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkUrl: e.target.value }))}
                placeholder="Optional - เช่น: https://example.com/promotion"
              />
              <Input
                label="ข้อความบนลิงก์"
                value={formData.linkText}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkText: e.target.value }))}
                placeholder="Optional - เช่น: ดูรายละเอียด"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={handleClose} isDisabled={isSubmitting}>
            ยกเลิก
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting}>
            สร้างโปรโมชั่น
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
