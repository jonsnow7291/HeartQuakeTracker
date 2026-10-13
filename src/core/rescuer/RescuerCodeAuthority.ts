import { ed25519 } from '@noble/curves/ed25519.js';
import { fromBase64, utf8 } from '../util/bytes';
import { sha256Hex } from '../sync/deviceAuth';

/**
 * Lista firmada de códigos de socorrista (D-06, ADR 0005). El servidor publica SOLO hashes de los códigos
 * vigentes (`GET /v1/rescuer/list`) firmados con Ed25519; la app guarda esa lista y valida los códigos sin
 * conexión. Ningún código viaja en claro dentro de la app.
 */
export interface SignedRescuerList {
  issuedAt: string;
  hashes: string[];
  /** Clave pública que el servidor dice haber usado. Se ignora: solo vale la clave fijada en la app. */
  publicKey?: string;
  signature: string;
}

export interface RescuerTrust {
  /** Clave pública Ed25519 del servidor (base64, 32 bytes), fijada en la app. */
  publicKey: string;
  /** Pimienta del hash; debe coincidir con RESCUER_PEPPER del servidor. No es secreta: la seguridad depende de la entropía de los códigos. */
  pepper: string;
  /** Antigüedad máxima aceptada de la lista, en días (una lista vieja no refleja las revocaciones). */
  maxAgeDays: number;
}

/** Mensaje canónico firmado por el servidor (igual a rescuerListMessage de server/src/services/rescuer.ts). */
export const rescuerListMessage = (issuedAt: string, hashes: string[]): string => `${issuedAt}|${[...hashes].sort().join(',')}`;

/** Hash de un código: sha256(pimienta:CÓDIGO) con el código recortado y en mayúsculas (igual al servidor). */
export const hashRescuerCode = (code: string, pepper: string): string => sha256Hex(`${pepper}:${code.trim().toUpperCase()}`);

export interface RescuerAuthority {
  isAuthorized(code: string): boolean;
}

export type ListRejection = 'FIRMA_INVALIDA' | 'LISTA_VENCIDA' | 'FORMATO';

export class RescuerCodeAuthority implements RescuerAuthority {
  private hashes = new Set<string>();
  private issuedAt?: string;

  constructor(
    private readonly trust: RescuerTrust,
    private readonly now: () => number = () => Date.now(),
    /** Códigos en claro SOLO para compilaciones de desarrollo; en producción debe ir vacío. */
    private readonly devCodes: readonly string[] = [],
  ) {}

  /** Valida firma y antigüedad y, si son correctas, reemplaza la lista activa. Devuelve null si se aceptó. */
  public load(list: SignedRescuerList): ListRejection | null {
    if (!list || typeof list.issuedAt !== 'string' || !Array.isArray(list.hashes) || typeof list.signature !== 'string') return 'FORMATO';
    const issued = Date.parse(list.issuedAt);
    if (Number.isNaN(issued)) return 'FORMATO';
    try {
      const ok = ed25519.verify(fromBase64(list.signature), utf8(rescuerListMessage(list.issuedAt, list.hashes)), fromBase64(this.trust.publicKey));
      if (!ok) return 'FIRMA_INVALIDA';
    } catch {
      return 'FIRMA_INVALIDA';
    }
    // Una lista más antigua que la ya cargada no la reemplaza (evita volver a una lista previa a una revocación).
    if (this.issuedAt && issued < Date.parse(this.issuedAt)) return null;
    if (this.now() - issued > this.trust.maxAgeDays * 86_400_000) return 'LISTA_VENCIDA';
    this.hashes = new Set(list.hashes);
    this.issuedAt = list.issuedAt;
    return null;
  }

  public get listIssuedAt(): string | undefined {
    return this.issuedAt;
  }

  public get size(): number {
    return this.hashes.size;
  }

  public isAuthorized(code: string): boolean {
    const normalized = code.trim().toUpperCase();
    if (normalized.length < 8) return false;
    if (this.devCodes.some((c) => c.toUpperCase() === normalized)) return true;
    return this.hashes.has(hashRescuerCode(normalized, this.trust.pepper));
  }
}
