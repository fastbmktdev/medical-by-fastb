'use client';

import { memo, useMemo } from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/design-system/primitives/Button';
import { Modal } from './Modal';
import { ConfirmationModalProps } from './types';

const ConfirmationModalComponent = memo(function ConfirmationModal({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  loading = false,
  testId = 'confirmation-modal',
  ...modalProps
}: ConfirmationModalProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      modalProps.onClose();
    }
  };

  const icon = useMemo(() => {
    switch (confirmVariant) {
      case 'danger':
        return <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="w-12 h-12 text-blue-500" />;
    }
  }, [confirmVariant]);

  // Map confirmVariant to Button variant (Button doesn't support 'warning')
  const buttonVariant = useMemo(() => {
    switch (confirmVariant) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'primary'; // Map warning to primary for Button
      default:
        return 'primary';
    }
  }, [confirmVariant]);

  return (
    <Modal
      {...modalProps}
      title={title}
      size="sm"
      testId={testId}
    >
      <div className="p-6">
        {/* Icon and Message */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            {icon}
          </div>
          <p className="text-zinc-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={loading}
            className="sm:order-1"
            data-testid={`${testId}-cancel`}
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={onConfirm}
            loading={loading}
            className="sm:order-2"
            data-testid={`${testId}-confirm`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export { ConfirmationModalComponent as ConfirmationModal };