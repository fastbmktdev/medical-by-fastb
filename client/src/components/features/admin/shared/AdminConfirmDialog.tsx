import { Button } from '@heroui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import AdminModalBase from './AdminModalBase';

export interface AdminConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  warningMessage?: string;
  confirmText?: string;
  confirmColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  isProcessing?: boolean;
}

/**
 * Reusable confirmation dialog for admin actions
 * Provides consistent styling and behavior for destructive actions
 */
export default function AdminConfirmDialog({
  isOpen,
  onClose,
  title,
  message,
  warningMessage,
  confirmText = 'ยืนยัน',
  confirmColor = 'danger',
  cancelText = 'ยกเลิก',
  onConfirm,
  isProcessing = false,
}: AdminConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
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
        color={confirmColor}
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
        <p className="text-white">{message}</p>
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