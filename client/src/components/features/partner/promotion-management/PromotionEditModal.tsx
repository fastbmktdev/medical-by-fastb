"use client";

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Switch, Select, SelectItem } from '@heroui/react';
import { toast } from 'react-hot-toast';

interface Promotion {
  id: string;
  title: string;
  title_english?: string | null;
  description?: string | null;
  is_active: boolean;
  priority: number;
  show_in_marquee: boolean;
  start_date?: string | null;
  end_date?: string | null;
  link_url?: string | null;
  link_text?: string | null;
  discount_type?: 'percentage' | 'fixed_amount' | null;
  discount_value?: number | null;
  package_id?: string | null;
  min_purchase_amount?: number | null;
  max_discount_amount?: number | null;
  max_uses?: number | null;
  current_uses?: number | null;
}

interface PromotionPackage {
  id: string;
  name: string;
  package_type: 'one_time' | 'package';
  price: number;
}

interface PromotionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promotion: Promotion;
}

export default function PromotionEditModal({ isOpen, onClose, onSuccess, promotion }: PromotionEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packages, setPackages] = useState<PromotionPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
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
    // Discount fields
    discountType: '',
    discountValue: '',
    packageId: '',
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    maxUses: '',
  });

  // Load packages when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPackages();
    }
  }, [isOpen]);

  async function loadPackages() {
    try {
      setIsLoadingPackages(true);
      const response = await fetch('/api/partner/packages');
      const result = await response.json();
      if (result.success && result.data?.packages) {
        setPackages(result.data.packages);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setIsLoadingPackages(false);
    }
  }

  useEffect(() => {
    if (promotion) {
      setFormData({
        title: promotion.title || '',
        titleEnglish: promotion.title_english || '',
        description: promotion.description || '',
        isActive: promotion.is_active || false,
        priority: promotion.priority || 0,
        showInMarquee: promotion.show_in_marquee || false,
        startDate: promotion.start_date 
          ? new Date(promotion.start_date).toISOString().slice(0, 16)
          : '',
        endDate: promotion.end_date
          ? new Date(promotion.end_date).toISOString().slice(0, 16)
          : '',
        linkUrl: promotion.link_url || '',
        linkText: promotion.link_text || '',
        discountType: promotion.discount_type || '',
        discountValue: promotion.discount_value?.toString() || '',
        packageId: promotion.package_id || '',
        minPurchaseAmount: promotion.min_purchase_amount?.toString() || '',
        maxDiscountAmount: promotion.max_discount_amount?.toString() || '',
        maxUses: promotion.max_uses?.toString() || '',
      });
    }
  }, [promotion]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('กรุณากรอกชื่อโปรโมชั่น');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};

      if (formData.title) payload.title = formData.title.trim();
      if (formData.titleEnglish !== undefined) payload.titleEnglish = formData.titleEnglish.trim() || null;
      if (formData.description !== undefined) payload.description = formData.description.trim() || null;
      if (formData.isActive !== undefined) payload.isActive = formData.isActive;
      if (formData.priority !== undefined) payload.priority = parseInt(formData.priority.toString()) || 0;
      if (formData.showInMarquee !== undefined) payload.showInMarquee = formData.showInMarquee;
      if (formData.startDate) payload.startDate = new Date(formData.startDate).toISOString();
      else if (formData.startDate === '') payload.startDate = null;
      if (formData.endDate) payload.endDate = new Date(formData.endDate).toISOString();
      else if (formData.endDate === '') payload.endDate = null;
      if (formData.linkUrl !== undefined) payload.linkUrl = formData.linkUrl.trim() || null;
      if (formData.linkText !== undefined) payload.linkText = formData.linkText.trim() || null;

      // Add discount fields
      if (formData.discountType !== undefined) {
        payload.discountType = formData.discountType || null;
      }
      if (formData.discountValue !== undefined) {
        payload.discountValue = formData.discountValue ? Number(formData.discountValue) : null;
      }
      if (formData.packageId !== undefined) {
        payload.packageId = formData.packageId || null;
      }
      if (formData.minPurchaseAmount !== undefined) {
        payload.minPurchaseAmount = formData.minPurchaseAmount ? Number(formData.minPurchaseAmount) : null;
      }
      if (formData.maxDiscountAmount !== undefined) {
        payload.maxDiscountAmount = formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null;
      }
      if (formData.maxUses !== undefined) {
        payload.maxUses = formData.maxUses ? Number(formData.maxUses) : null;
      }

      const response = await fetch(`/api/partner/promotions/${promotion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('แก้ไขโปรโมชั่นสำเร็จ');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error updating promotion:', error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
        <ModalHeader className="flex flex-col gap-1">แก้ไขโปรโมชั่น</ModalHeader>
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
                description="ตัวเลขสูงกว่า = แสดงก่อน"
              />
              <div className="flex flex-col gap-2">
                <Switch
                  isSelected={formData.isActive}
                  onValueChange={(isActive) => setFormData((prev) => ({ ...prev, isActive }))}
                >
                  เปิดใช้งาน
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
                placeholder="Optional"
              />
              <Input
                label="ข้อความบนลิงก์"
                value={formData.linkText}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkText: e.target.value }))}
                placeholder="Optional"
              />
            </div>

            {/* Discount Section */}
            <div className="border-t border-divider pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">ตั้งค่าส่วนลด (Optional)</h3>
              
              <div className="space-y-4">
                <Select
                  label="ประเภทส่วนลด"
                  placeholder="เลือกประเภทส่วนลด (ถ้าต้องการ)"
                  selectedKeys={formData.discountType ? [formData.discountType] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData((prev) => ({ 
                      ...prev, 
                      discountType: selected || '',
                      discountValue: selected ? prev.discountValue : '', // Keep value if setting type
                    }));
                  }}
                >
                  <SelectItem key="percentage">เปอร์เซ็นต์ (%)</SelectItem>
                  <SelectItem key="fixed_amount">จำนวนเงินคงที่ (฿)</SelectItem>
                </Select>

                {formData.discountType && (
                  <>
                    <Input
                      type="number"
                      label={formData.discountType === 'percentage' ? 'เปอร์เซ็นต์ส่วนลด' : 'จำนวนเงินส่วนลด'}
                      value={formData.discountValue}
                      onChange={(e) => setFormData((prev) => ({ ...prev, discountValue: e.target.value }))}
                      placeholder={formData.discountType === 'percentage' ? 'เช่น: 10 (หมายถึง 10%)' : 'เช่น: 500 (หมายถึง ฿500)'}
                      min={0}
                      max={formData.discountType === 'percentage' ? 100 : undefined}
                      description={formData.discountType === 'percentage' ? 'ค่าระหว่าง 0-100' : 'จำนวนเงินส่วนลด'}
                    />

                    <Select
                      label="แพ็คเกจที่ใช้ได้"
                      placeholder="เลือกแพ็คเกจ (ถ้าไม่เลือก = ใช้ได้ทุกแพ็คเกจ)"
                      selectedKeys={formData.packageId ? [formData.packageId] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setFormData((prev) => ({ ...prev, packageId: selected || '' }));
                      }}
                      isLoading={isLoadingPackages}
                      description="ถ้าไม่เลือก = ใช้ได้ทุกแพ็คเกจ"
                    >
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id}>
                          {pkg.name} ({pkg.package_type === 'one_time' ? 'รายครั้ง' : 'แพ็คเกจ'}) - ฿{(pkg.price || 0).toLocaleString()}
                        </SelectItem>
                      ))}
                    </Select>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        label="ยอดซื้อขั้นต่ำ (฿)"
                        value={formData.minPurchaseAmount}
                        onChange={(e) => setFormData((prev) => ({ ...prev, minPurchaseAmount: e.target.value }))}
                        placeholder="Optional - เช่น: 1000"
                        min={0}
                        description="ยอดซื้อขั้นต่ำที่ต้องใช้ส่วนลด"
                      />
                      {formData.discountType === 'percentage' && (
                        <Input
                          type="number"
                          label="ส่วนลดสูงสุด (฿)"
                          value={formData.maxDiscountAmount}
                          onChange={(e) => setFormData((prev) => ({ ...prev, maxDiscountAmount: e.target.value }))}
                          placeholder="Optional - เช่น: 500"
                          min={0}
                          description="ส่วนลดสูงสุดสำหรับส่วนลดแบบเปอร์เซ็นต์"
                        />
                      )}
                    </div>

                    <Input
                      type="number"
                      label="จำนวนครั้งที่ใช้ได้สูงสุด"
                      value={formData.maxUses}
                      onChange={(e) => setFormData((prev) => ({ ...prev, maxUses: e.target.value }))}
                      placeholder="Optional - เช่น: 100 (ถ้าไม่กรอก = ไม่จำกัด)"
                      min={1}
                      description="จำนวนครั้งที่โปรโมชั่นนี้สามารถใช้ได้ (ถ้าไม่กรอก = ไม่จำกัด)"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose} isDisabled={isSubmitting}>
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
