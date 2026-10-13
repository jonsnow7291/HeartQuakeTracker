import { AlertsServiceImpl } from '../../src/core/sensors/AlertsServiceImpl';
import type { KeyValueStore } from '../../src/core/platform/ports';

/** Almacén que, como SQLite sin cola, falla si recibe dos escrituras a la vez ("database is locked"). */
class AlmacenQueSeBloquea implements KeyValueStore {
  private data = new Map<string, string>();
  private escribiendo = false;
  public bloqueos = 0;
  async get(k: string) { return this.data.get(k) ?? null; }
  async set(k: string, v: string) {
    if (this.escribiendo) { this.bloqueos++; throw new Error('database is locked'); }
    this.escribiendo = true;
    await new Promise((r) => setTimeout(r, 2));
    this.data.set(k, v);
    this.escribiendo = false;
  }
  async delete(k: string) { this.data.delete(k); }
  async keys(prefix: string) { return [...this.data.keys()].filter((k) => k.startsWith(prefix)); }
}

describe('Alertas sísmicas con muchas lecturas a la vez (regresión «database is locked»)', () => {
  it('guarda todas las alertas, en orden y sin perder ninguna', async () => {
    let listener: ((a: unknown) => void) | undefined;
    const sensorService = { subscribe: (cb: (a: unknown) => void) => { listener = cb; return () => undefined; } } as never;
    const store = new AlmacenQueSeBloquea();
    const service = new AlertsServiceImpl({ sensorService, store });
    const errores = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    for (let i = 0; i < 15; i++) {
      listener?.({ id: `s${i}`, level: 'POSSIBLE', peakG: 0.1 + i / 1000, detectedAt: new Date(1_790_000_000_000 + i * 1000).toISOString(), nodes: 1 });
    }
    await new Promise((r) => setTimeout(r, 200));

    expect(errores).not.toHaveBeenCalled();
    expect((await service.list()).items.length).toBe(15);
    expect(store.bloqueos).toBe(0);
  });
});
