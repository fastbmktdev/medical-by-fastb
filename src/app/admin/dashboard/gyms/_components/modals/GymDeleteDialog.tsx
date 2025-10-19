import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { GymDeleteDialogProps } from '../../_lib';

export default function GymDeleteDialog({
  isOpen,
  onClose,
  gym,
  onConfirm,
  isProcessing,
}: GymDeleteDialogProps) {
  if (!gym) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        wrapper: "z-[100]",
        base: 'bg-zinc-900 border border-zinc-800',
        header: 'border-b border-zinc-800',
        body: 'py-6',
        footer: 'border-t border-zinc-800',
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-warning" />
              <span className="text-white">ยืนยันการลบยิม</span>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <p className="text-white">
                  คุณต้องการลบยิม <span className="font-semibold">"{gym.gym_name}"</span> ใช่หรือไม่?
                </p>
                <div className="flex items-start gap-2 bg-warning/10 p-3 border-l-4 border-warning rounded">
                  <ExclamationTriangleIcon className="flex-shrink-0 mt-0.5 w-5 h-5 text-warning" />
                  <p className="text-default-300 text-sm">
                    การลบนี้ไม่สามารถย้อนกลับได้ ข้อมูลยิมทั้งหมดจะถูกลบออกจากระบบอย่างถาวร
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="default"
                variant="light"
                onPress={onClose}
                isDisabled={isProcessing}
              >
                ยกเลิก
              </Button>
              <Button
                color="danger"
                onPress={() => onConfirm(gym.id)}
                isLoading={isProcessing}
              >
                ยืนยันการลบ
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
