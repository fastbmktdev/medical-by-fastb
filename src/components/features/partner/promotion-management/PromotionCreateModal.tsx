"use client";

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Switch, Select, SelectItem } from '@heroui/react';
import { toast } from 'react-hot-toast';

interface PromotionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface GymPackage {
  id: string;
  name: string;
  package_type: 'one_time' | 'package';
  price: number;
}

export default function PromotionCreateModal({ isOpen, onClose, onSuccess }: PromotionCreateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packages, setPackages] = useState<GymPackage[]>([]);
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
      if (formData.packageId) payload.packageId = formData.packageId;
      else payload.packageId = null;
      if (formData.minPurchaseAmount) payload.minPurchaseAmount = Number(formData.minPurchaseAmount);
      else payload.minPurchaseAmount = null;
      if (formData.maxDiscountAmount) payload.maxDiscountAmount = Number(formData.maxDiscountAmount);
      else payload.maxDiscountAmount = null;
      if (formData.maxUses) payload.maxUses = Number(formData.maxUses);
      else payload.maxUses = null;

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
      discountType: '',
      discountValue: '',
      packageId: '',
      minPurchaseAmount: '',
      maxDiscountAmount: '',
      maxUses: '',
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
                      discountValue: '', // Reset value when type changes
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
                      isRequired={!!formData.discountType}
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