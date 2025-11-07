import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a debounced version of a callback.
 * The debounced function delays invoking `fn` until after `delay` ms
 * have elapsed since the last time it was called.
 *
 * @param fn The callback function to debounce
 * @param delay The debounce delay in milliseconds
 */
export function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep ref up to date
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        fnRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // Optional: cancel on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debouncedFn as T;
}
