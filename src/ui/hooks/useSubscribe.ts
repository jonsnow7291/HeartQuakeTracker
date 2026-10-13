import { useState, useEffect, useRef } from 'react';
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
  // Los llamadores pasan una flecha nueva en cada render. Si el efecto dependiera de ella se volvería a
  // suscribir en cada render y, como los servicios reales emiten el estado al suscribirse, entraría en
  // un bucle ("Maximum update depth exceeded"). Se suscribe una sola vez mientras exista la función.
  const fnRef = useRef(subscribeFn);
  fnRef.current = subscribeFn;
  const enabled = subscribeFn !== undefined;

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = fnRef.current?.((newData) => {
      setData(newData);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [enabled]);

  return data;
}
