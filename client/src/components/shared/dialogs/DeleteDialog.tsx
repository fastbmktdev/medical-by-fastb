'use client';

import { Button } from '@heroui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import AdminModalBase from '@/components/features/admin/shared/AdminModalBase';

export interface DeleteDialogProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  itemName: string;
  item?: T;
  onConfirm: (item?: T) => void | Promise<void>;
  isProcessing?: boolean;
  confirmText?: string;
  cancelText?: string;
  warningMessage?: string;
}

/**
 * Generic reusable delete confirmation dialog
 * Can be used for any resource type
 *
 * @example
 * ```tsx
 * <DeleteDialog
 *   isOpen={showDeleteDialog}
 *   onClose={() => setShowDeleteDialog(false)}
 *   title="ลบโรงพยาบาล"
 *   itemName={hospital?.name}
 *   item={hospital}
 *   onConfirm={handleDeleteHospital}
 *   isProcessing={isDeleting}
 * />
 * ```
 */
export default function DeleteDialog<T = any>({
  isOpen,
  onClose,
  title,
  itemName,
  item,
  onConfirm,
  isProcessing = false,
  confirmText = 'ยืนยันการลบ',
  cancelText = 'ยกเลิก',
  warningMessage = 'การลบนี้ไม่สามารถย้อนกลับได้ ข้อมูลจะถูกลบออกจากระบบอย่างถาวร',
}: DeleteDialogProps<T>) {
  const handleConfirm = async () => {
    await onConfirm(item);
  };

  const footer = (
    <>
      <Button
        color="default"
        variant="light"
        onPress={onClose}
        isDisabled={isProcessing}
      >
        {cancelText}
      </Button>
      <Button
        color="danger"
        onPress={handleConfirm}
        isLoading={isProcessing}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <AdminModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      footer={footer}
      showCloseButton={false}
      isProcessing={isProcessing}
    >
      <div className="space-y-4">
        <p className="text-zinc-950">
          คุณต้องการลบ <span className="font-semibold">{itemName}</span> ใช่หรือไม่?
        </p>
        {warningMessage && (
          <div className="flex items-start gap-2 bg-warning/10 p-3 border-warning border-l-4 ">
            <ExclamationTriangleIcon className="shrink-0 mt-0.5 w-5 h-5 text-warning" />
            <p className="text-default-300 text-sm">{warningMessage}</p>
          </div>
        )}
      </div>
    </AdminModalBase>
  );
}
