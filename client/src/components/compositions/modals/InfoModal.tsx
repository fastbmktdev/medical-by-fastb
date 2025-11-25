'use client';

import { 
  InformationCircleIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/design-system/primitives/Button';
import { Modal } from './Modal';
import { InfoModalProps } from './types';

export function InfoModal({
  title,
  message,
  icon,
  variant = 'info',
  actionText = 'OK',
  onAction,
  testId = 'info-modal',
  ...modalProps
}: InfoModalProps) {
  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      modalProps.onClose();
    }
  };

  const getDefaultIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircleIcon className="w-12 h-12 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="w-12 h-12 text-red-500" />;
      default:
        return <InformationCircleIcon className="w-12 h-12 text-blue-500" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'from-green-900/20 to-green-800/20 border-green-600';
      case 'warning':
        return 'from-yellow-900/20 to-yellow-800/20 border-yellow-600';
      case 'error':
        return 'from-red-900/20 to-red-800/20 border-red-600';
      default:
        return 'from-blue-900/20 to-blue-800/20 border-blue-600';
    }
  };

  return (
    <Modal
      {...modalProps}
      title={title}
      size="sm"
      testId={testId}
    >
      <div
        className={`p-6  border bg-linear-to-br ${getVariantStyles()}`}
      >
        {/* Icon and Message */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            {icon || getDefaultIcon()}
          </div>
          <p className="text-zinc-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            onClick={handleAction}
            data-testid={`${testId}-action`}
          >
            {actionText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}