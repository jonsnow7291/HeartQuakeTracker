import { buildStatusMessage } from '../../src/core/util/statusMessage';

describe('Mensaje para compartir el estado', () => {
  const t = new Date('2026-10-12T15:30:00');
  it('con posición real incluye el enlace de mapa y la precisión', () => {
    const m = buildStatusMessage('SAFE', { lat: 4.7, lon: -74.1, accuracyM: 12.4, ts: t.toISOString() }, t);
    expect(m).toContain('Estoy a salvo');
    expect(m).toContain('mlat=4.70000&mlon=-74.10000');
    expect(m).toContain('±12 m');
  });
  it('sin posición no inventa coordenadas', () => {
    const m = buildStatusMessage('HELP', undefined, t);
    expect(m).toContain('NECESITO AYUDA');
    expect(m).toContain('No pude obtener mi ubicación');
    expect(m).not.toMatch(/mlat=/);
  });
  it('no incluye datos médicos', () => {
    expect(buildStatusMessage('HELP', { lat: 1, lon: 1, ts: t.toISOString() }, t)).not.toMatch(/sangre|alergia|ficha/i);
  });
});
