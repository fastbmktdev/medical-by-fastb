"use client";

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Switch, Select, SelectItem } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface PromotionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PromotionCreateModal({ isOpen, onClose, onSuccess }: PromotionCreateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscountOptions, setShowDiscountOptions] = useState(false);
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
    // Coupon code
    couponCode: '',
    // Discount fields
    discountType: '',
    discountValue: '',
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    maxUses: '',
  });

  // Generate random coupon code
  const generateCouponCode = () => {
    const prefix = formData.title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'PROM';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${prefix}${random}`;
    setFormData((prev) => ({ ...prev, couponCode: code }));
  };

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
      
      // Add coupon code
      if (formData.couponCode) {
        payload.couponCode = formData.couponCode.trim().toUpperCase();
      }
      
      // Add discount fields
      if (formData.discountType) {
        payload.discountType = formData.discountType;
        if (formData.discountValue) {
          payload.discountValue = Number(formData.discountValue);
        }
      } else {
        payload.discountType = null;
        payload.discountValue = null;
      }
      if (formData.minPurchaseAmount) payload.minPurchaseAmount = Number(formData.minPurchaseAmount);
      if (formData.maxDiscountAmount) payload.maxDiscountAmount = Number(formData.maxDiscountAmount);
      if (formData.maxUses) payload.maxUses = parseInt(formData.maxUses);

      const response = await fetch('/api/admin/promotions', {
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
      couponCode: '',
      discountType: '',
      discountValue: '',
      minPurchaseAmount: '',
      maxDiscountAmount: '',
      maxUses: '',
    });
    setShowDiscountOptions(false);
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
            />
            <Input
              label="ชื่อโปรโมชั่น (อังกฤษ)"
              value={formData.titleEnglish}
              onChange={(e) => setFormData((prev) => ({ ...prev, titleEnglish: e.target.value }))}
              placeholder="Optional"
            />
            <Textarea
              label="คำอธิบาย"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              minRows={3}
              placeholder="Optional"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="ความสำคัญ (Priority)"
                value={formData.priority.toString()}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                description="ตัวเลขมากกว่า = แสดงก่อน"
              />
              <div className="flex items-center gap-4 pt-6">
                <Switch
                  isSelected={formData.isActive}
                  onValueChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                >
                  เปิดใช้งาน
                </Switch>
                <Switch
                  isSelected={formData.showInMarquee}
                  onValueChange={(checked) => setFormData((prev) => ({ ...prev, showInMarquee: checked }))}
                >
                  แสดงใน Marquee
                </Switch>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="datetime-local"
                label="วันที่เริ่มต้น"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
              />
              <Input
                type="datetime-local"
                label="วันที่สิ้นสุด"
                value={formData.endDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <Input
              label="ลิงก์ (URL)"
              value={formData.linkUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, linkUrl: e.target.value }))}
              placeholder="https://example.com"
            />
            <Input
              label="ข้อความบนลิงก์"
              value={formData.linkText}
              onChange={(e) => setFormData((prev) => ({ ...prev, linkText: e.target.value }))}
              placeholder="เช่น: ดูรายละเอียด"
            />
            
            {/* Coupon Code Section */}
            <div className="border-t border-zinc-700 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Coupon Code (Optional)</label>
                <Button
                  size="sm"
                  variant="light"
                  onPress={generateCouponCode}
                  startContent={<SparklesIcon className="w-4 h-4" />}
                >
                  สร้างอัตโนมัติ
                </Button>
              </div>
              <Input
                placeholder="เช่น: PROMO2025 หรือปล่อยว่างสำหรับโปรโมชั่นอัตโนมัติ"
                value={formData.couponCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                description="ถ้ามี Coupon Code ผู้ใช้ต้องกรอกโค้ดเพื่อใช้ส่วนลด"
              />
            </div>
            
            {/* Discount Options Toggle */}
            <div className="border-t border-zinc-700 pt-4">
              <Switch
                isSelected={showDiscountOptions}
                onValueChange={setShowDiscountOptions}
              >
                <span className="font-medium">เพิ่มส่วนลด</span>
              </Switch>
            </div>
            
            {/* Discount Fields */}
            {showDiscountOptions && (
              <div className="space-y-4 border border-zinc-700 rounded-lg p-4 bg-zinc-900/50">
                <Select
                  label="ประเภทส่วนลด"
                  placeholder="เลือกประเภทส่วนลด"
                  selectedKeys={formData.discountType ? [formData.discountType] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setFormData((prev) => ({ ...prev, discountType: value }));
                  }}
                >
                  <SelectItem key="percentage">เปอร์เซ็นต์ (%)</SelectItem>
                  <SelectItem key="fixed_amount">จำนวนเงินคงที่ (บาท)</SelectItem>
                </Select>
                
                {formData.discountType && (
                  <>
                    <Input
                      type="number"
                      label={formData.discountType === 'percentage' ? 'ส่วนลด (%)' : 'ส่วนลด (บาท)'}
                      value={formData.discountValue}
                      onChange={(e) => setFormData((prev) => ({ ...prev, discountValue: e.target.value }))}
                      description={formData.discountType === 'percentage' ? '0-100' : 'จำนวนเงินที่ลด'}
                      min={0}
                      max={formData.discountType === 'percentage' ? 100 : undefined}
                    />
                    
                    {formData.discountType === 'percentage' && (
                      <Input
                        type="number"
                        label="ส่วนลดสูงสุด (บาท)"
                        value={formData.maxDiscountAmount}
                        onChange={(e) => setFormData((prev) => ({ ...prev, maxDiscountAmount: e.target.value }))}
                        description="จำกัดจำนวนเงินส่วนลดสูงสุด (Optional)"
                        min={0}
                      />
                    )}
                    
                    <Input
                      type="number"
                      label="ยอดซื้อขั้นต่ำ (บาท)"
                      value={formData.minPurchaseAmount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, minPurchaseAmount: e.target.value }))}
                      description="ยอดซื้อขั้นต่ำที่ต้องใช้โปรโมชั่น (Optional)"
                      min={0}
                    />
                    
                    <Input
                      type="number"
                      label="จำนวนครั้งที่ใช้ได้สูงสุด"
                      value={formData.maxUses}
                      onChange={(e) => setFormData((prev) => ({ ...prev, maxUses: e.target.value }))}
                      description="จำนวนครั้งที่ใช้ได้ (ปล่อยว่าง = ใช้ได้ไม่จำกัด)"
                      min={1}
                    />
                  </>
                )}
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
