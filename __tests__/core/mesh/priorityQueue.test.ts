import { MeshPriorityQueue } from '../../../src/core/mesh/priorityQueue';
import { MeshPacket } from '../../../src/core/mesh/types';

describe('Mesh Priority Queue (D-24, máx 200 priorizada)', () => {
  const makePacket = (
    severity: 'ILESO' | 'CON_LESIONES' | 'ATRAPADO',
    timestamp: number,
    seq = 1,
  ): MeshPacket => ({
    version: 1,
    relayed: true,
    lowPower: false,
    medicalAvailable: false,
    hasLocation: false,
    type: 'SOS',
    idEphemeral: 'node12345678',
    seq,
    severity,
    timestamp,
    ttl: 3,
    authTag: new Uint8Array(4),
  });

  it('ordena por severidad: ATRAPADO > CON_LESIONES > ILESO', () => {
    const queue = new MeshPriorityQueue(200);

    queue.push(makePacket('ILESO', 100));
    queue.push(makePacket('ATRAPADO', 200));
    queue.push(makePacket('CON_LESIONES', 150));

    expect(queue.pop()?.severity).toBe('ATRAPADO');
    expect(queue.pop()?.severity).toBe('CON_LESIONES');
    expect(queue.pop()?.severity).toBe('ILESO');
  });

  it('a igualdad de severidad prioriza el timestamp más reciente', () => {
    const queue = new MeshPriorityQueue(200);

    queue.push(makePacket('CON_LESIONES', 100, 1));
    queue.push(makePacket('CON_LESIONES', 300, 2));
    queue.push(makePacket('CON_LESIONES', 200, 3));

    expect(queue.pop()?.timestamp).toBe(300);
    expect(queue.pop()?.timestamp).toBe(200);
    expect(queue.pop()?.timestamp).toBe(100);
  });

  it('mantiene un límite exacto de 200 mensajes descartando lo menos prioritario', () => {
    const queue = new MeshPriorityQueue(200);

    // Llenar con 200 mensajes 'ILESO'
    for (let i = 0; i < 200; i++) {
      queue.push(makePacket('ILESO', 1000 + i, i));
    }
    expect(queue.size()).toBe(200);

    // Agregar un mensaje 'ATRAPADO': debe ser admitido y expulsar el 'ILESO' de menor prioridad
    const accepted = queue.push(makePacket('ATRAPADO', 5000, 999));
    expect(accepted).toBe(true);
    expect(queue.size()).toBe(200);
    expect(queue.peek()?.severity).toBe('ATRAPADO');

    // Intentar agregar un 'ILESO' con timestamp muy bajo en cola llena de mejores: debe rechazarse
    const rejected = queue.push(makePacket('ILESO', 10, 888));
    expect(rejected).toBe(false);
    expect(queue.size()).toBe(200);
  });
});
