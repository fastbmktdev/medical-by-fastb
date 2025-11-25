'use client';

import { useState } from 'react';
import { Button } from '@/components/design-system/primitives/Button';
import { Modal } from './Modal';
import { FormModalProps } from './types';

export function FormModal({
  title,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onSubmit,
  onCancel,
  loading = false,
  children,
  testId = 'form-modal',
  ...modalProps
}: FormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      const data = Object.fromEntries(formData.entries());
      
      await onSubmit(data);
      modalProps.onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      modalProps.onClose();
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <Modal
      {...modalProps}
      title={title}
      testId={testId}
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <form onSubmit={handleSubmit}>
        {/* Form Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end p-6 border-t border-zinc-700 bg-zinc-100 text-zinc-950">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading}
            className="sm:order-1"
            data-testid={`${testId}-cancel`}
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            className="sm:order-2"
            data-testid={`${testId}-submit`}
          >
            {submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}