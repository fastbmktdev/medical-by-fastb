import { twMerge } from "tailwind-merge";

type ClassValue = string | number | null | boolean | undefined | { [key: string]: any } | ClassValue[];

const clsx = (...inputs: ClassValue[]): string => {
  const classes = [];
  for (const input of inputs) {
    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(input);
    } else if (Array.isArray(input)) {
      classes.push(clsx(...input));
    } else if (typeof input === 'object' && input !== null) {
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key) && input[key]) {
          classes.push(key);
        }
      }
    }
  }
  return classes.join(' ');
};

/**
 * Merges Tailwind CSS classes conditionally.
 * @param inputs - Class values to merge.
 * @returns A merged class string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
