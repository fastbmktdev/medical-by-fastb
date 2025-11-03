import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import { ReactNode } from 'react';

export interface AdminModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  scrollBehavior?: 'inside' | 'outside';
  children: ReactNode;
  footer?: ReactNode;
  showCloseButton?: boolean;
  closeButtonText?: string;
  isProcessing?: boolean;
}

/**
 * Base modal component for admin interfaces
 * Provides consistent styling and behavior across all admin modals
 */
export default function AdminModalBase({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  scrollBehavior = 'inside',
  children,
  footer,
  showCloseButton = true,
  closeButtonText = 'ปิด',
  isProcessing = false,
}: AdminModalBaseProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      scrollBehavior={scrollBehavior}
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        wrapper: "z-[100]",
        base: 'bg-zinc-950 border border-zinc-800',
        header: 'border-b border-zinc-800',
        body: 'py-6',
        footer: 'border-t border-zinc-800',
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className=" text-xl">{title}</h3>
              {subtitle && (
                <p className="text-default-400 text-sm">{subtitle}</p>
              )}
            </ModalHeader>
            <ModalBody>
              {children}
            </ModalBody>
            {(footer || showCloseButton) && (
              <ModalFooter>
                {footer}
                {showCloseButton && (
                  <Button
                    color="default"
                    variant="light"
                    onPress={onClose}
                    isDisabled={isProcessing}
                  >
                    {closeButtonText}
                  </Button>
                )}
              </ModalFooter>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}