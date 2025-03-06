import { useEffect, useState } from "react";

/**
 * Custom hook to debounce a value over a specified delay.
 *
 * @param value - The value to debounce (can be string, number, object, etc.).
 * @param delay - The debounce delay in milliseconds.
 * @returns The debounced value after the specified delay.
 */
function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
