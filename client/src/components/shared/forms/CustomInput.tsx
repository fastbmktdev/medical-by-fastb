import React from 'react';
import { BaseInput, type BaseInputProps } from '@/components/design-system/primitives/BaseInput';

export interface InputProps extends Omit<BaseInputProps, 'leftIcon'> {
  /**
   * Icon to display (mapped to leftIcon for backward compatibility)
   */
  icon?: React.ReactNode;
  /**
   * Input type
   */
  type?: string;
}

/**
 * Text Input Component
 * 
 * Standard text input built on BaseInput with backward compatibility.
 * Supports all BaseInput features with simplified props.
 */
const CustomInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, type = "text", ...props }, ref) => {
    return (
      <BaseInput
        ref={ref}
        type={type}
        leftIcon={icon}
        {...props}
      />
    );
  }
);

CustomInput.displayName = 'CustomInput';

export { CustomInput };
