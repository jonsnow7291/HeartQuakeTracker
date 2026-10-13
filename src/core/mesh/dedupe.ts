import { MeshClock, defaultMeshClock } from './ports';

interface DedupeEntry {
  expiresAt: number;
}

/**
 * Deduplicador de mensajes de malla basado en clave (idEphemeral, seq) con TTL de 10 min (D-24).
 * Implementa política LRU con capacidad acotada y eliminación de entradas expiradas.
 */
export class MeshDeduplicator {
  private readonly entries = new Map<string, DedupeEntry>();
  private readonly ttlMs: number;
  private readonly maxCapacity: number;
  private readonly clock: MeshClock;

  constructor(ttlMs = 10 * 60 * 1000, maxCapacity = 2000, clock: MeshClock = defaultMeshClock) {
    this.ttlMs = ttlMs;
    this.maxCapacity = maxCapacity;
    this.clock = clock;
  }

  private makeKey(idEphemeral: string, seq: number): string {
    return `${idEphemeral.toLowerCase()}:${seq}`;
  }

  /**
   * Comprueba si el mensaje ya fue visto dentro de la ventana TTL.
   */
  public has(idEphemeral: string, seq: number, nowMs?: number): boolean {
    const key = this.makeKey(idEphemeral, seq);
    const entry = this.entries.get(key);
    if (!entry) {
      return false;
    }
    const now = nowMs ?? this.clock.now();
    if (entry.expiresAt <= now) {
      this.entries.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Registra un mensaje como visto con TTL de 10 minutos.
   */
  public add(idEphemeral: string, seq: number, nowMs?: number): void {
    const now = nowMs ?? this.clock.now();
    const key = this.makeKey(idEphemeral, seq);

    if (this.entries.has(key)) {
      this.entries.delete(key);
    } else if (this.entries.size >= this.maxCapacity) {
      this.cleanExpired(now);
      if (this.entries.size >= this.maxCapacity) {
        // Expulsar la entrada más antigua (primer elemento del Map)
        const firstKey = this.entries.keys().next().value;
        if (firstKey !== undefined) {
          this.entries.delete(firstKey);
        }
      }
    }

    this.entries.set(key, { expiresAt: now + this.ttlMs });
  }

  /**
   * Limpia entradas expiradas de la memoria.
   */
  public cleanExpired(nowMs?: number): void {
    const now = nowMs ?? this.clock.now();
    for (const [key, entry] of this.entries.entries()) {
      if (entry.expiresAt <= now) {
        this.entries.delete(key);
      }
    }
  }

  public size(): number {
    return this.entries.size;
  }

  public clear(): void {
    this.entries.clear;
    this.entries.clear();
  }
}
