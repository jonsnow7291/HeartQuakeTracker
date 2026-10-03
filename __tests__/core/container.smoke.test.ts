import { getServices } from '../../src/core/container';

// Humo: el container de mocks arranca y los servicios responden (atrapa errores de ejecución, no solo de tipos).
describe('container de mocks (humo)', () => {
  const s = getServices();

  it('instancia los 16 servicios', () => {
    const names = ['session', 'permissions', 'medical', 'emergency', 'mesh', 'rescuer', 'sensors', 'alerts', 'sync', 'reports', 'content', 'progress', 'poi', 'tiles', 'aid', 'power'];
    for (const n of names) expect((s as unknown as Record<string, unknown>)[n]).toBeDefined();
  });

  it('progreso: el mock arranca con la insignia inicial (regresión del Map)', async () => {
    const badges = await s.progress.listBadges();
    expect(badges.map((b) => b.code)).toContain('PRIMERA_GUIA');
  });

  it('emergencia inicia en IDLE y el permiso faltante se reporta como lista', async () => {
    expect(s.emergency.getState().phase).toBe('IDLE');
    const r = await s.emergency.requestPanic();
    expect(Array.isArray(r.missing)).toBe(true);
  });

  it('contenido y ayudas responden', async () => {
    expect((await s.content.listGuides()).length).toBeGreaterThan(0);
    expect((await s.aid.listEntities()).length).toBeGreaterThan(0);
  });
});
