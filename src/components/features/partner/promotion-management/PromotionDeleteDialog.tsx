"use client";

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { toast } from 'react-hot-toast';

interface Promotion {
  id: string;
  title: string;
}

interface PromotionDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  promotion: Promotion;
}

export default function PromotionDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  promotion,
}: PromotionDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/partner/promotions/${promotion.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('ลบโปรโมชั่นสำเร็จ');
        onConfirm();
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
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
        <ModalHeader className="flex flex-col gap-1">ยืนยันการลบโปรโมชั่น</ModalHeader>
        <ModalBody>
          <p className="text-white">
            คุณแน่ใจหรือไม่ว่าต้องการลบโปรโมชั่น &quot;{promotion.title}&quot;?
          </p>
          <p className="text-red-400 text-sm mt-2">
            การกระทำนี้ไม่สามารถย้อนกลับได้
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose} isDisabled={isDeleting}>
            ยกเลิก
          </Button>
          <Button color="danger" onPress={handleDelete} isLoading={isDeleting}>
            ลบ
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}