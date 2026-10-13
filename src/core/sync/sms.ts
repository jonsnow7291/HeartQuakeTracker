import type { GeoPoint, Severity } from '../../contracts/types';

export interface EmergencySmsOptions {
  /** Nivel de gravedad reportado (ILESO | CON_LESIONES | ATRAPADO). */
  severity?: Severity;
  /** Coordenadas geográficas actuales o última posición conocida. */
  position?: GeoPoint;
  /** Número de destino opcional (ej: línea de emergencias 123 o contacto familiar). */
  recipientNumber?: string;
  /** Mensaje adicional personalizado. */
  customNote?: string;
}

/**
 * Formatea el texto de auxilio para el SMS prellenado (Decisión D-25).
 * Diseñado para ser conciso, legible y contener coordenadas exactas y enlace web.
 */
export function formatEmergencySmsText(opts: EmergencySmsOptions): string {
  const severityLabel = opts.severity ? opts.severity : 'EMERGENCIA';
  const parts: string[] = [`[EarthQuakeTracker SOS] ESTADO: ${severityLabel}`];

  if (opts.position) {
    const lat = opts.position.lat.toFixed(5);
    const lon = opts.position.lon.toFixed(5);
    parts.push(`Ubicación: https://maps.google.com/?q=${lat},${lon} (${lat}, ${lon})`);
    if (opts.position.accuracyM) {
      parts.push(`Precisión: ±${Math.round(opts.position.accuracyM)}m`);
    }
  } else {
    parts.push('Ubicación GPS no disponible');
  }

  if (opts.customNote && opts.customNote.trim()) {
    parts.push(`Nota: ${opts.customNote.trim()}`);
  } else {
    parts.push('Requiere verificación y apoyo inmediato.');
  }

  const ts = opts.position?.ts ?? new Date().toISOString();
  parts.push(`Hora: ${ts}`);

  return parts.join(' | ');
}

/**
 * Construye la URL de esquema "sms:" compatible con Android e iOS para abrir la app de mensajería (D-25).
 */
export function buildSmsUrl(opts: EmergencySmsOptions): string {
  const text = formatEmergencySmsText(opts);
  const recipient = opts.recipientNumber ? opts.recipientNumber.trim() : '';
  // En Android e iOS 'sms:NUMERO?body=TEXTO' es el estándar más universal
  return `sms:${recipient}?body=${encodeURIComponent(text)}`;
}
