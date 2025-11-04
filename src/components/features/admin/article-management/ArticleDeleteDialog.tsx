"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { Article } from '@/types';

interface ArticleDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  article: Article;
}

export default function ArticleDeleteDialog({ isOpen, onClose, onConfirm, article }: ArticleDeleteDialogProps) {
  const handleConfirm = async () => {
    try {
      const response = await fetch(`/api/articles/${article.id}-admin`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        onConfirm();
      } else {
        console.error('Delete error:', result.error);
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>ยืนยันการลบ</ModalHeader>
        <ModalBody>
          <p>คุณแน่ใจหรือไม่ว่าต้องการลบบทความ &quot;{article.title}&quot;?</p>
          <p className="text-sm text-zinc-400">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            ยกเลิก
          </Button>
          <Button color="danger" onPress={handleConfirm}>
            ลบ
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
