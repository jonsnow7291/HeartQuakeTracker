import { z } from 'zod';

export const EVENT_TYPES = [
  'REPORT_DAMAGE',
  'REQUEST_AID',
  'MARK_SAFE',
  'POI_PROBLEM',
  'SENSOR_READING',
  'POSITION',
  'EMERGENCY_STARTED',
  'EMERGENCY_STOPPED',
] as const;

export const geoSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  acc: z.number().nonnegative().optional(),
});

export const eventSchema = z.object({
  eventId: z.string().min(8).max(64),
  type: z.enum(EVENT_TYPES),
  ts: z.string().datetime(),
  device: z.string().min(1).max(64),
  payload: z.record(z.unknown()).default({}),
  geo: geoSchema.optional(),
});

/** Máximo de eventos por lote (docs: JD-071). */
export const MAX_BATCH = 500;

export const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(MAX_BATCH),
});

export type SyncEvent = z.infer<typeof eventSchema>;
export type AckStatus = 'OK' | 'DUP' | 'REJECTED';
export interface Ack {
  eventId: string;
  status: AckStatus;
  reason?: string;
}
