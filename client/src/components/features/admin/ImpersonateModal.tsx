"use client";

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from '@heroui/react';
import { UserIcon } from '@heroicons/react/24/outline';

interface ImpersonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  targetUserId: string;
  targetUserEmail?: string;
  isLoading?: boolean;
}

export function ImpersonateModal({
  isOpen,
  onClose,
  onConfirm,
  targetUserId,
  targetUserEmail,
  isLoading = false,
}: ImpersonateModalProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = async () => {
    await onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      scrollBehavior="inside"
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-warning" />
                <span>เข้าสู่ระบบในฐานะผู้ใช้อื่น</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="p-4 bg-warning/10 border border-warning/20 ">
                  <p className="text-sm text-warning font-semibold mb-2">
                    ⚠️ คำเตือน
                  </p>
                  <p className="text-sm text-default-600">
                    คุณกำลังจะเข้าสู่ระบบในฐานะผู้ใช้อื่น การกระทำทั้งหมดจะถูกบันทึกใน audit log
                    และผู้ใช้จะไม่ทราบว่าคุณกำลังเข้าสู่ระบบในฐานะเขา
                  </p>
                </div>

                <div>
                  <p className="text-sm text-default-600 mb-2">
                    <strong>User ID:</strong> {targetUserId}
                  </p>
                  {targetUserEmail && (
                    <p className="text-sm text-default-600 mb-4">
                      <strong>Email:</strong> {targetUserEmail}
                    </p>
                  )}
                </div>

                <Textarea
                  label="เหตุผล (จำเป็น)"
                  placeholder="ระบุเหตุผลในการเข้าสู่ระบบในฐานะผู้ใช้นี้ เช่น Support ticket #12345, ตรวจสอบปัญหา appointment, etc."
                  value={reason}
                  onValueChange={setReason}
                  minRows={3}
                  isRequired
                  description="กรุณาระบุเหตุผลที่ชัดเจนเพื่อการตรวจสอบในภายหลัง"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={handleClose}
                isDisabled={isLoading}
              >
                ยกเลิก
              </Button>
              <Button
                color="warning"
                onPress={handleConfirm}
                isLoading={isLoading}
                isDisabled={!reason.trim()}
                startContent={!isLoading && <UserIcon className="w-4 h-4" />}
              >
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'ยืนยัน'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

