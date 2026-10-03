import { z } from 'zod';

export const POI_TYPES = ['ALBERGUE', 'ACOPIO', 'BOMBEROS', 'SALUD', 'ZONA_SEGURA'] as const;

export const poiInput = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(POI_TYPES),
  name: z.string().min(1).max(200),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  address: z.string().max(300).optional(),
  phone: z.string().max(40).optional(),
  active: z.boolean().default(true),
  source: z.string().max(200).optional(),
  verified: z.boolean().default(false),
});

export const aidEntityInput = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  kind: z.enum(['GOBIERNO', 'ONG', 'SOCORRO']),
  description: z.string().max(1000).optional(),
  active: z.boolean(),
  verifiedAt: z.string().datetime(),
  verified: z.boolean().optional(),
  channels: z.array(
    z.object({
      type: z.enum(['WEB', 'TEL', 'CUENTA', 'EMAIL']),
      value: z.string().min(1).max(300),
      requirements: z.string().max(500).optional(),
      active: z.boolean(),
    }),
  ),
});

export const aidNeedInput = z.object({
  id: z.string().min(1).max(64),
  category: z.string().min(1).max(64),
  label: z.string().min(1).max(200),
  urgency: z.enum(['ALTA', 'MEDIA', 'BAJA']),
});

export const contentPublishInput = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'versión semver x.y.z'),
  files: z
    .array(z.object({ path: z.string().min(1).max(300), contentBase64: z.string().min(1) }))
    .min(1)
    .max(500),
});

export const tileRegionInput = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  sizeMB: z.number().positive(),
  hash: z.string().max(128).optional(),
  version: z.string().min(1).max(32),
  url: z.string().url().optional(),
});

export const rescuerCodeInput = z.object({
  code: z.string().min(6).max(64),
  organization: z.string().min(1).max(200),
  expiresAt: z.string().datetime(),
});

export const registerInput = z.object({
  publicKey: z.string().min(40).max(60),
  platform: z.enum(['android', 'ios']),
  appVersion: z.string().min(1).max(32),
  ts: z.number().int(),
  proof: z.string().min(1),
});

export const readingsInput = z.object({
  readings: z
    .array(
      z.object({
        eventId: z.string().min(8).max(64).optional(),
        ts: z.string().datetime(),
        peakG: z.number().min(0).max(20),
        lat: z.number().min(-90).max(90).optional(),
        lon: z.number().min(-180).max(180).optional(),
        quorumNodes: z.number().int().min(0).default(0),
        classification: z.enum(['POSSIBLE', 'CONFIRMED', 'DISCARDED']).default('POSSIBLE'),
      }),
    )
    .min(1)
    .max(100),
});
