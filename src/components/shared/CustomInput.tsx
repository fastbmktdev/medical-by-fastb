import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
  label: string;
}

const CustomInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, label, ...props }, ref) => {
    return (
      <div>
        <label
          htmlFor={props.id}
          className="block mb-2 font-medium text-zinc-300 text-sm"
        >
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="top-3.5 left-3 absolute w-5 h-5 text-zinc-500">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              `w-full bg-zinc-700 border ${
                error ? "border-red-500" : "border-zinc-600"
              } rounded-lg px-4 py-3 ${icon ? 'pl-10' : ''} text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`,
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-red-400 text-sm">{error}</p>
        )}
      </div>
    );
  }
);
CustomInput.displayName = 'CustomInput';

export { CustomInput };
