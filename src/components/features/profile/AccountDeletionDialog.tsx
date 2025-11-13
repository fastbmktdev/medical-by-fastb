"use client";

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Checkbox,
} from '@heroui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface AccountDeletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountDeletionDialog({ isOpen, onClose }: AccountDeletionDialogProps) {
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirmed) {
      toast.error('กรุณายืนยันว่าคุณต้องการลบบัญชี');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/users/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          deletion_reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete account');
      }

      toast.success('คำขอลบบัญชีได้รับการยืนยันแล้ว คุณมี 30 วันในการกู้คืนบัญชี');
      onClose();
      
      // Redirect to home page after a delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error: unknown) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบบัญชี';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent className="bg-zinc-900 border border-red-800">
        <ModalHeader className="flex items-center gap-3 border-b border-red-800/50">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
          <span className="text-red-400">ลบบัญชีถาวร</span>
        </ModalHeader>
        <ModalBody className="space-y-4 py-6">
          <div className="bg-red-950/30 border border-red-800/50 p-4 rounded-lg">
            <p className="text-red-200 text-sm">
              ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้! บัญชีของคุณจะถูกทำเครื่องหมายว่าถูกลบและจะถูกลบถาวรหลังจาก 30 วัน
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium text-sm text-white">
                กรอกรหัสผ่านเพื่อยืนยัน
              </label>
              <Input
                type="password"
                value={password}
                onValueChange={setPassword}
                placeholder="กรอกรหัสผ่านของคุณ"
                variant="bordered"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-zinc-950/50 border-zinc-700",
                }}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-sm text-white">
                เหตุผลที่ลบบัญชี (ไม่บังคับ)
              </label>
              <Textarea
                value={reason}
                onValueChange={setReason}
                placeholder="บอกเราว่าทำไมคุณถึงต้องการลบบัญชี..."
                variant="bordered"
                minRows={3}
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-zinc-950/50 border-zinc-700",
                }}
              />
            </div>

            <Checkbox
              isSelected={confirmed}
              onValueChange={setConfirmed}
              classNames={{
                label: "text-white",
              }}
            >
              <span className="text-white text-sm">
                ฉันเข้าใจว่าการดำเนินการนี้ไม่สามารถย้อนกลับได้ และฉันต้องการลบบัญชีของฉันจริงๆ
              </span>
            </Checkbox>
          </div>

          <div className="bg-zinc-950/50 p-4 rounded-lg">
            <p className="text-zinc-400 text-sm">
              <strong className="text-white">Grace Period:</strong> คุณมีเวลา 30 วันในการกู้คืนบัญชีของคุณ
              หลังจากนั้นบัญชีจะถูกลบถาวร
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="border-t border-red-800/50">
          <Button variant="flat" onPress={onClose} isDisabled={isDeleting}>
            ยกเลิก
          </Button>
          <Button
            color="danger"
            onPress={handleDelete}
            isLoading={isDeleting}
            isDisabled={!confirmed || !password}
          >
            ลบบัญชีถาวร
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

