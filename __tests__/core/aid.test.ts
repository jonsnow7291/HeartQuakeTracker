import { AidDirectoryServiceImpl } from '../../src/core/aid/AidDirectoryServiceImpl';

const entidades = require('../../server/seed/entidades_ayuda.json');
const necesidades = require('../../server/seed/necesidades.json');

describe('Directorio de ayuda (RF-11)', () => {
  const service = new AidDirectoryServiceImpl(entidades, necesidades);

  it('lista las entidades del catálogo de referencia', async () => {
    const list = await service.listEntities();
    expect(list.length).toBe(entidades.length);
    expect(list.every((e) => e.channels.length > 0)).toBe(true);
  });

  it('no presenta como verificado lo que el registro no confirma', async () => {
    const list = await service.listEntities();
    for (const e of list) expect(e.verified).toBe(entidades.find((x: { id: string }) => x.id === e.id).verified === true);
    expect(list.some((e) => e.verified)).toBe(false); // hoy ninguno está verificado formalmente
  });

  it('la fecha de revisión es la del registro, no la del momento', async () => {
    const antes = Date.now();
    const list = await service.listEntities();
    for (const e of list) expect(Date.parse(e.verifiedAt)).toBeLessThan(antes - 60_000);
    expect(list.map((e) => e.verifiedAt)).toEqual(entidades.map((e: { verifiedAt: string }) => e.verifiedAt));
  });

  it('lista las necesidades con su urgencia', async () => {
    const needs = await service.listNeeds();
    expect(needs.length).toBe(necesidades.length);
    expect(needs.every((n) => ['ALTA', 'MEDIA', 'BAJA'].includes(n.urgency))).toBe(true);
  });
});
