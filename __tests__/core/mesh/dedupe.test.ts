import { MeshDeduplicator } from '../../../src/core/mesh/dedupe';
import { FakeClock } from '../support/nodePorts';

describe('Mesh Dedupe (D-24)', () => {
  it('deduplica mensajes idénticos (idEphemeral, seq)', () => {
    const clock = new FakeClock(1_000_000);
    const dedupe = new MeshDeduplicator(10 * 60 * 1000, 100, clock);

    expect(dedupe.has('node1', 1)).toBe(false);
    dedupe.add('node1', 1);
    expect(dedupe.has('node1', 1)).toBe(true);

    // Secuencias o nodos distintos no colisionan
    expect(dedupe.has('node1', 2)).toBe(false);
    expect(dedupe.has('node2', 1)).toBe(false);
  });

  it('expira las entradas tras el TTL de 10 minutos', () => {
    const clock = new FakeClock(1_000_000);
    const ttlMs = 10 * 60 * 1000;
    const dedupe = new MeshDeduplicator(ttlMs, 100, clock);

    dedupe.add('nodeA', 10);
    expect(dedupe.has('nodeA', 10)).toBe(true);

    // Avanzar 9 minutos: sigue vigente
    clock.advance(9 * 60 * 1000);
    expect(dedupe.has('nodeA', 10)).toBe(true);

    // Avanzar 2 minutos más (total 11 minutos): ha expirado
    clock.advance(2 * 60 * 1000);
    expect(dedupe.has('nodeA', 10)).toBe(false);
  });

  it('respeta la capacidad máxima expulsando elementos viejos (LRU)', () => {
    const clock = new FakeClock(1_000_000);
    const maxCapacity = 3;
    const dedupe = new MeshDeduplicator(10 * 60 * 1000, maxCapacity, clock);

    dedupe.add('node1', 1);
    dedupe.add('node2', 2);
    dedupe.add('node3', 3);
    expect(dedupe.size()).toBe(3);

    // Insertar cuarto elemento desaloja el más antiguo ('node1:1')
    dedupe.add('node4', 4);
    expect(dedupe.size()).toBe(3);
    expect(dedupe.has('node1', 1)).toBe(false);
    expect(dedupe.has('node4', 4)).toBe(true);
  });
});
