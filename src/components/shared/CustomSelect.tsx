import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label: string;
}

const CustomSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, label, ...props }, ref) => {
    return (
      <div>
        <label
          htmlFor={props.id}
          className="block mb-2 font-medium text-zinc-300 text-sm"
        >
          {label}
        </label>
        <div className="relative">
          <select
            className={cn(
              `appearance-none w-full bg-zinc-700 border ${
                error ? "border-red-500" : "border-zinc-600"
              } rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`,
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <ChevronDownIcon className="top-3.5 right-3 absolute w-5 h-5 text-zinc-500 pointer-events-none" />
        </div>
        {error && (
          <p className="mt-2 text-red-400 text-sm">{error}</p>
        )}
      </div>
    );
  }
);
CustomSelect.displayName = 'CustomSelect';

export { CustomSelect };
