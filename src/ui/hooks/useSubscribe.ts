import { useState, useEffect } from 'react';
import { Unsubscribe } from '../../contracts/types';

/**
 * Custom React hook for safely subscribing to an event-emitting contract method.
 * Automatically unsubscribes when the component unmounts.
 *
 * @param subscribeFn The contract subscription function returning an Unsubscribe callback.
 * @param initialValue Optional initial state value.
 */
export function useSubscribe<T>(
  subscribeFn: ((cb: (data: T) => void) => Unsubscribe) | undefined,
  initialValue?: T
): T | undefined {
  const [data, setData] = useState<T | undefined>(initialValue);

  useEffect(() => {
    if (!subscribeFn) return;

    const unsubscribe = subscribeFn((newData) => {
      setData(newData);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [subscribeFn]);

  return data;
}
