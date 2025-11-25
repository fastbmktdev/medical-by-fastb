import { ReactNode } from 'react';
import { Button } from '@heroui/react';
import AdminModalBase from './AdminModalBase';

export interface AdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  children: ReactNode;
  onSubmit: () => void | Promise<void>;
  isProcessing?: boolean;
  isFormValid?: boolean;
  submitText?: string;
  cancelText?: string;
  submitColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

/**
 * Specialized modal for admin forms
 * Provides consistent form submission patterns and validation states
 */
export default function AdminFormModal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = '3xl',
  children,
  onSubmit,
  isProcessing = false,
  isFormValid = true,
  submitText = 'บันทึก',
  cancelText = 'ยกเลิก',
  submitColor = 'primary',
}: AdminFormModalProps) {
  const handleSubmit = async () => {
    await onSubmit();
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
        color={submitColor}
        onPress={handleSubmit}
        isLoading={isProcessing}
        isDisabled={!isFormValid || isProcessing}
      >
        {submitText}
      </Button>
    </>
  );

  return (
    <AdminModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size={size}
      footer={footer}
      showCloseButton={false}
      isProcessing={isProcessing}
    >
      {children}
    </AdminModalBase>
  );
}