import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label: string;
}

const CustomTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div>
        <label
          htmlFor={props.id}
          className="block mb-2 font-medium text-zinc-300 text-sm"
        >
          {label}
        </label>
        <textarea
          className={cn(
            `w-full bg-zinc-700 border ${
              error ? "border-red-500" : "border-zinc-600"
            } rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono`,
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-2 text-red-400 text-sm">{error}</p>
        )}
      </div>
    );
  }
);
CustomTextarea.displayName = 'CustomTextarea';

export { CustomTextarea };
