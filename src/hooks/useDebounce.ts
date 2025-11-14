import { useEffect, useState } from 'react';

/**
 * Custom hook that returns a debounced value
 * 
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedSearchQuery = useDebounce(searchQuery, 300);
 * 
 * useEffect(() => {
 *   if (debouncedSearchQuery) {
 *     // Perform search API call
 *     fetchResults(debouncedSearchQuery);
 *   }
 * }, [debouncedSearchQuery]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook that returns a debounced callback function
 * 
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced callback function
 * 
 * @example
 * ```tsx
 * const handleSearch = useDebouncedCallback((query: string) => {
 *   fetchResults(query);
 * }, 300);
 * 
 * <input onChange={(e) => handleSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return (...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}

