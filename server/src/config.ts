export interface Config {
  port: number;
  databaseUrl?: string;
  /** Token Bearer de las rutas /admin. Si falta, /admin responde 503. */
  adminToken?: string;
  /** Tolerancia del timestamp de las peticiones firmadas. */
  signatureSkewMs: number;
  /** Peticiones por minuto por dispositivo/IP (0 = sin límite). */
  rateLimitPerMin: number;
  /** Pepper para hashear códigos de socorrista. */
  rescuerPepper: string;
  /** Clave privada Ed25519 (PKCS8 base64) con la que el servidor firma la lista de socorristas. */
  serverSigningKey?: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 3000),
    databaseUrl: env.DATABASE_URL || undefined,
    adminToken: env.ADMIN_TOKEN || undefined,
    signatureSkewMs: Number(env.SIGNATURE_SKEW_MS ?? 300_000),
    rateLimitPerMin: Number(env.RATE_LIMIT_PER_MIN ?? 120),
    rescuerPepper: env.RESCUER_PEPPER ?? 'dev-pepper-cambiar',
    serverSigningKey: env.SERVER_SIGNING_KEY || undefined,
  };
}
