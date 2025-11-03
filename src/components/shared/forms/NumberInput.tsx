"use client";

import React from "react";
import { BaseInput, type BaseInputProps } from '@/components/design-system/primitives/BaseInput';

export interface NumberInputProps extends Omit<BaseInputProps, 'type' | 'value' | 'defaultValue' | 'onChange'> {
    /**
     * Number value
     */
    value?: number;
    /**
     * Default number value
     */
    defaultValue?: number;
    /**
     * Minimum value
     */
    min?: number;
    /**
     * Maximum value
     */
    max?: number;
    /**
     * Step increment
     */
    step?: number;
    /**
     * Number of decimal places to allow
     */
    precision?: number;
    /**
     * Whether to show increment/decrement buttons
     */
    showSteppers?: boolean;
    /**
     * Change handler that receives number value
     */
    onChange?: (value: number | undefined, event?: React.ChangeEvent<HTMLInputElement>) => void;
    /**
     * Format function for display value
     */
    formatValue?: (value: number) => string;
    /**
     * Parse function for input value
     */
    parseValue?: (value: string) => number | undefined;
}

/**
 * Number Input Component
 * 
 * Specialized input component for numeric values with validation and formatting.
 * Built on BaseInput with additional features for number-specific functionality.
 * 
 * Features:
 * - Number validation and parsing
 * - Min/max constraints
 * - Step increment/decrement
 * - Precision control
 * - Custom formatting and parsing
 * - Optional stepper buttons
 * - All BaseInput features
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
    (
        {
            value,
            defaultValue,
            min,
            max,
            step = 1,
            precision,
            showSteppers = false,
            onChange,
            formatValue,
            parseValue,
            onValidate,
            rightIcon,
            ...props
        },
        ref
    ) => {
        const [internalValue, setInternalValue] = React.useState<string>(() => {
            const initialValue = value ?? defaultValue;
            return initialValue !== undefined
                ? formatValue ? formatValue(initialValue) : initialValue.toString()
                : '';
        });

        // Parse string to number
        const parseNumber = React.useCallback((str: string): number | undefined => {
            if (parseValue) {
                return parseValue(str);
            }

            if (str === '' || str === '-') {
                return undefined;
            }

            const parsed = parseFloat(str);
            if (isNaN(parsed)) {
                return undefined;
            }

            // Apply precision if specified
            if (precision !== undefined) {
                return Math.round(parsed * Math.pow(10, precision)) / Math.pow(10, precision);
            }

            return parsed;
        }, [parseValue, precision]);

        // Format number to string
        const formatNumber = React.useCallback((num: number): string => {
            if (formatValue) {
                return formatValue(num);
            }

            if (precision !== undefined) {
                return num.toFixed(precision);
            }

            return num.toString();
        }, [formatValue, precision]);

        // Validate number constraints
        const validateNumber = React.useCallback((value: unknown): string | undefined => {
            const num = typeof value === 'number' ? value : undefined;
            
            if (num === undefined) {
                return undefined;
            }

            if (min !== undefined && num < min) {
                return `Value must be at least ${min}`;
            }

            if (max !== undefined && num > max) {
                return `Value must be at most ${max}`;
            }

            return onValidate ? onValidate(num) : undefined;
        }, [min, max, onValidate]);

        // Handle input change
        const handleChange = (inputValue: unknown, event?: React.ChangeEvent<HTMLElement>) => {
            const stringValue = typeof inputValue === 'string' ? inputValue : '';
            setInternalValue(stringValue);

            const numericValue = parseNumber(stringValue);
            onChange?.(numericValue, event as React.ChangeEvent<HTMLInputElement>);
        };

        // Handle increment/decrement
        const handleStep = (direction: 'up' | 'down') => {
            const currentNum = parseNumber(internalValue) ?? 0;
            const newValue = direction === 'up' ? currentNum + step : currentNum - step;

            // Apply constraints
            let constrainedValue = newValue;
            if (min !== undefined) constrainedValue = Math.max(constrainedValue, min);
            if (max !== undefined) constrainedValue = Math.min(constrainedValue, max);

            const formattedValue = formatNumber(constrainedValue);
            setInternalValue(formattedValue);
            onChange?.(constrainedValue);
        };

        // Stepper buttons
        const stepperButtons = showSteppers ? (
            <div className="flex flex-col">
                <button
                    type="button"
                    className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-300 focus:outline-none focus:text-zinc-300 transition-colors"
                    onClick={() => handleStep('up')}
                    aria-label="Increment"
                    tabIndex={-1}
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                </button>
                <button
                    type="button"
                    className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-300 focus:outline-none focus:text-zinc-300 transition-colors"
                    onClick={() => handleStep('down')}
                    aria-label="Decrement"
                    tabIndex={-1}
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
        ) : rightIcon;

        // Update internal value when external value changes
        React.useEffect(() => {
            if (value !== undefined) {
                const formatted = formatNumber(value);
                setInternalValue(formatted);
            }
        }, [value, formatNumber]);

        return (
            <BaseInput
                ref={ref}
                type="text"
                inputMode="numeric"
                value={internalValue}
                onChange={handleChange}
                onValidate={validateNumber}
                rightIcon={stepperButtons}
                {...props}
            />
        );
    }
);

NumberInput.displayName = "NumberInput";