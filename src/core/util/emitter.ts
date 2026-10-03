import type { Unsubscribe } from '../../contracts/types';

/** Emisor mínimo tipado para implementar `subscribe()`. */
export class Emitter<T> {
  private listeners = new Set<(v: T) => void>();

  subscribe(cb: (v: T) => void): Unsubscribe {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  emit(v: T): void {
    for (const l of [...this.listeners]) l(v);
  }
}
