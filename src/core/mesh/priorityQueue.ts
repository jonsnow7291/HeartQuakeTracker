import { MeshPacket } from './types';

/**
 * Puntuación de prioridad según gravedad: ATRAPADO > CON_LESIONES > ILESO (D-24).
 */
function getSeverityScore(packet: MeshPacket): number {
  switch (packet.severity) {
    case 'ATRAPADO':
      return 3;
    case 'CON_LESIONES':
      return 2;
    case 'ILESO':
      return 1;
    default:
      return 0;
  }
}

/**
 * Retorna true si 'a' tiene mayor prioridad que 'b'.
 * Orden: Severidad > timestamp más reciente.
 */
function isHigherPriority(a: MeshPacket, b: MeshPacket): boolean {
  const scoreA = getSeverityScore(a);
  const scoreB = getSeverityScore(b);
  if (scoreA !== scoreB) {
    return scoreA > scoreB;
  }
  return a.timestamp > b.timestamp;
}

/**
 * Cola priorizada acotada para retransmisión de malla BLE (máx. 200 paquetes, D-24).
 * Si la cola está llena y llega un mensaje de mayor prioridad, descarta el de menor prioridad.
 */
export class MeshPriorityQueue {
  private readonly items: MeshPacket[] = [];
  private readonly maxSize: number;

  constructor(maxSize = 200) {
    this.maxSize = maxSize;
  }

  /**
   * Inserta un paquete en la posición correspondiente según prioridad.
   * Si excede la capacidad de 200, expulsa el de menor prioridad.
   */
  public push(packet: MeshPacket): boolean {
    if (this.items.length >= this.maxSize) {
      const lowest = this.items[this.items.length - 1];
      if (lowest && !isHigherPriority(packet, lowest)) {
        // El nuevo paquete tiene menor o igual prioridad que el peor de la cola completa: se descarta
        return false;
      }
      // Expulsar el de menor prioridad
      this.items.pop();
    }

    // Inserción ordenada por prioridad decreciente
    let insertIndex = this.items.length;
    for (let i = 0; i < this.items.length; i++) {
      const current = this.items[i];
      if (current && isHigherPriority(packet, current)) {
        insertIndex = i;
        break;
      }
    }

    this.items.splice(insertIndex, 0, packet);
    return true;
  }

  /**
   * Extrae y devuelve el paquete de mayor prioridad.
   */
  public pop(): MeshPacket | undefined {
    return this.items.shift();
  }

  /**
   * Observa el paquete de mayor prioridad sin extraerlo.
   */
  public peek(): MeshPacket | undefined {
    return this.items[0];
  }

  public size(): number {
    return this.items.length;
  }

  public clear(): void {
    this.items.length = 0;
  }

  public toArray(): MeshPacket[] {
    return [...this.items];
  }
}
