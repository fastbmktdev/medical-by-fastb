"use client";

import React from "react";
import { BaseInput, type BaseInputProps } from "@/components/design-system/primitives/BaseInput";

export interface TextInputProps extends Omit<BaseInputProps, 'type'> {
  /**
   * Text input type
   */
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search';
  /**
   * Whether to show password visibility toggle (for password type)
   */
  showPasswordToggle?: boolean;
}

/**
 * Text Input Component
 * 
 * Specialized text input component with support for various text input types.
 * Built on BaseInput with additional features for text-specific functionality.
 * 
 * Features:
 * - Support for text, email, password, url, tel, search types
 * - Password visibility toggle
 * - All BaseInput features (validation, icons, states, etc.)
 */
export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      type = "text",
      showPasswordToggle = false,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPasswordType = type === 'password';
    const inputType = isPasswordType && showPassword ? 'text' : type;

    // Password toggle icon
    const passwordToggleIcon = isPasswordType && showPasswordToggle ? (
      <button
        type="button"
        className="p-1 text-zinc-400 hover:text-zinc-300 focus:outline-none focus:text-zinc-300 transition-colors"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {showPassword ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    ) : rightIcon;

    return (
      <BaseInput
        ref={ref}
        type={inputType}
        rightIcon={passwordToggleIcon}
        {...props}
      />
    );
  }
);

TextInput.displayName = "TextInput";