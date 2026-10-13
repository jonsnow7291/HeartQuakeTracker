import type { AidDirectoryService, AidEntity, AidNeed } from '../../contracts/aid';

/** Forma de un registro del catálogo de referencia (server/seed/entidades_ayuda.json). */
interface SeedEntity extends Omit<AidEntity, 'verified'> {
  verified?: boolean;
}

/**
 * Directorio de ayuda (RF-11): catálogo informativo que viaja con la app y funciona sin conexión.
 * Sale de los datos de referencia del servidor (server/seed). Cada entidad conserva su fecha de revisión
 * y su estado `verified`: la app solo la presenta como verificada si el registro lo está; nunca se
 * genera una fecha de verificación «de hoy». Las entidades inactivas se marcan como tales (RF-11 A1).
 */
export class AidDirectoryServiceImpl implements AidDirectoryService {
  constructor(
    private readonly entities: SeedEntity[],
    private readonly needs: AidNeed[],
  ) {}

  public async listEntities(): Promise<AidEntity[]> {
    return this.entities.map((e) => ({
      ...e,
      verified: e.verified === true,
      // Un canal inactivo no se ofrece: se conserva en la lista pero marcado.
      channels: e.channels.map((c) => ({ ...c })),
    }));
  }

  public async listNeeds(): Promise<AidNeed[]> {
    return this.needs.map((n) => ({ ...n }));
  }
}
