import {useEffect, useState} from 'react';

/**
 * Returns `value` after it has stayed unchanged for `delayMs`.
 * Empty strings flush immediately so clearing search does not wait.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (typeof value === 'string' && value.trim() === '') {
      setDebounced(value);
      return;
    }
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
