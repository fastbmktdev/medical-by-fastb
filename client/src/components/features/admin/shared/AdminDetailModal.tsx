import { ReactNode } from 'react';
import AdminModalBase from './AdminModalBase';

export interface AdminDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  children: ReactNode;
  actions?: ReactNode;
  isProcessing?: boolean;
}

/**
 * Specialized modal for displaying detailed information
 * Provides consistent layout for admin detail views
 */
export default function AdminDetailModal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = '3xl',
  children,
  actions,
  isProcessing = false,
}: AdminDetailModalProps) {
  return (
    <AdminModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size={size}
      footer={actions}
      isProcessing={isProcessing}
    >
      {children}
    </AdminModalBase>
  );
}