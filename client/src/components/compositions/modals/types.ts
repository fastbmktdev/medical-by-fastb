import { ReactNode } from 'react';
import { BaseComponentProps } from '@/components/design-system/types';

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  children: ReactNode;
}

export interface ConfirmationModalProps extends Omit<ModalProps, 'children'> {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'warning';
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export interface FormModalProps extends Omit<ModalProps, 'children'> {
  title: string;
  submitText?: string;
  cancelText?: string;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  children: ReactNode;
}

export interface InfoModalProps extends Omit<ModalProps, 'children'> {
  title: string;
  message: string;
  icon?: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  actionText?: string;
  onAction?: () => void;
}