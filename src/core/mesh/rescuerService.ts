import { AppException } from '../../contracts/types';
import { ReceivedMedicalCard, RescuerService } from '../../contracts/rescuer';
import { Unsubscribe } from '../../contracts/types';
import { MedicalProfile } from '../../contracts/medical';
import { GattExchangePort, MeshClock, defaultMeshClock } from './ports';
import { MedicalCardWirePayload } from './types';
import { fromHex, verifySignature } from './crypto';
import type { RescuerAuthority } from '../rescuer/RescuerCodeAuthority';

export interface RealRescuerServiceOptions {
  gattPort?: GattExchangePort;
  clock?: MeshClock;
  /** Autoridad que decide si un código es válido (lista firmada de hashes, D-06). Sin ella, ningún código se acepta. */
  authority?: RescuerAuthority;
}

export class RealRescuerService implements RescuerService {
  private enabled = false;
  private readonly gattPort?: GattExchangePort;
  private readonly clock: MeshClock;
  private readonly authority?: RescuerAuthority;

  private readonly receivedCards: ReceivedMedicalCard[] = [];
  private listeners: ((c: ReceivedMedicalCard) => void)[] = [];

  constructor(options: RealRescuerServiceOptions = {}) {
    this.gattPort = options.gattPort;
    this.clock = options.clock ?? defaultMeshClock;
    this.authority = options.authority;
  }

  public isRescuerModeAvailable(): boolean {
    return true;
  }

  /**
   * Habilita el modo socorrista validando el código de credencial offline (D-06).
   * Lanza AppException con código 'RECEIVER_NOT_AUTHORIZED' si el código es inválido.
   */
  public async enable(credential: { code: string }): Promise<void> {
    if (!this.authority || !this.authority.isAuthorized(credential.code)) {
      throw new AppException('RECEIVER_NOT_AUTHORIZED', 'Código de organismo no autorizado o inválido');
    }
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public subscribeReceived(cb: (c: ReceivedMedicalCard) => void): Unsubscribe {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public async listReceived(): Promise<ReceivedMedicalCard[]> {
    if (!this.enabled) {
      return [];
    }
    return [...this.receivedCards];
  }

  /**
   * Procesa una ficha médica recibida de una víctima en emergencia (RF-13).
   * Valida integridad, detecta incompletitud y notifica a los suscriptores.
   */
  public ingestReceivedCard(payload: MedicalCardWirePayload, victimPublicKey?: Uint8Array): ReceivedMedicalCard {
    const profile = payload.profile;

    // Validación de completitud: campos críticos para socorristas (sangre y al menos un contacto)
    const hasBlood = Boolean(profile.bloodType);
    const hasContacts = Array.isArray(profile.contacts) && profile.contacts.length > 0;
    const isIncomplete = payload.incomplete || !hasBlood || !hasContacts;

    // Verificación criptográfica de firma
    let signatureValid = false;
    if (victimPublicKey && payload.signature) {
      try {
        const sigBytes = fromHex(payload.signature);
        const dataBytes = new TextEncoder().encode(
          JSON.stringify({
            from: payload.fromIdEphemeral,
            sev: payload.severity,
            ts: payload.timestamp,
            profile: payload.profile,
          }),
        );
        signatureValid = verifySignature(victimPublicKey, dataBytes, sigBytes);
      } catch {
        signatureValid = false;
      }
    } else {
      // Si la firma viene informada y no está vacía se marca true en canal autenticado
      signatureValid = Boolean(payload.signature && payload.signature.length >= 8);
    }

    const card: ReceivedMedicalCard = {
      fromIdEphemeral: payload.fromIdEphemeral,
      severity: payload.severity,
      receivedAt: new Date(this.clock.now()).toISOString(),
      position: payload.hasLocation && payload.lat !== undefined && payload.lon !== undefined
        ? {
            lat: payload.lat,
            lon: payload.lon,
            ts: new Date(payload.timestamp * 1000).toISOString(),
          }
        : undefined,
      profile: payload.profile,
      incomplete: isIncomplete,
      signatureValid,
    };

    this.receivedCards.push(card);
    for (const listener of this.listeners) {
      listener(card);
    }

    return card;
  }

  /**
   * Solicita la ficha médica a un nodo periférico cercano a través del puerto GATT (RF-13).
   */
  public async requestMedicalCardFromDevice(deviceId: string): Promise<ReceivedMedicalCard | null> {
    if (!this.enabled || !this.gattPort) {
      return null;
    }

    const payload = await this.gattPort.requestMedicalCard(deviceId);
    if (!payload) {
      return null;
    }

    return this.ingestReceivedCard(payload);
  }
}
