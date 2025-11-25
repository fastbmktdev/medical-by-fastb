'use client';

import { Button } from '@heroui/react';
import { ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import AdminModalBase from '@/components/features/admin/shared/AdminModalBase';

export interface ConfirmDialogProps {
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
  showIcon?: boolean;
}

/**
 * Generic reusable confirmation dialog
 * Can be used for any confirmation action
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   title="ยืนยันการดำเนินการ"
 *   message="คุณต้องการดำเนินการต่อหรือไม่?"
 *   onConfirm={handleConfirm}
 *   confirmColor="primary"
 * />
 * ```
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  title,
  message,
  warningMessage,
  confirmText = 'ยืนยัน',
  confirmColor = 'primary',
  cancelText = 'ยกเลิก',
  onConfirm,
  isProcessing = false,
  showIcon = true,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const getIcon = () => {
    if (!showIcon) return null;

    switch (confirmColor) {
      case 'danger':
        return <ExclamationTriangleIcon className="w-12 h-12 text-danger" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-12 h-12 text-warning" />;
      case 'success':
        return <CheckCircleIcon className="w-12 h-12 text-success" />;
      default:
        return <InformationCircleIcon className="w-12 h-12 text-primary" />;
    }
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
        {showIcon && (
          <div className="flex justify-center">
            {getIcon()}
          </div>
        )}
        <p className="text-white text-center">{message}</p>
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
