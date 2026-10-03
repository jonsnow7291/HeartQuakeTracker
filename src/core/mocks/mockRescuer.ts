import { RescuerService, ReceivedMedicalCard } from '../../contracts/rescuer';
import { Unsubscribe } from '../../contracts/types';
import { MockDevScenarioController } from './mockDevScenarios';

export class MockRescuerService implements RescuerService {
  private enabled: boolean = false;
  private devController?: MockDevScenarioController;
  private listeners: ((c: ReceivedMedicalCard) => void)[] = [];

  constructor(devController?: MockDevScenarioController) {
    this.devController = devController;
  }

  public isRescuerModeAvailable(): boolean {
    return true;
  }

  public async enable(credential: { code: string }): Promise<void> {
    if (credential.code !== 'DEFENSA-CIVIL-2026' && credential.code !== 'BOMBEROS-BOG-2026') {
      const err = new Error('Código de organismo no autorizado o inválido');
      (err as any).code = 'RECEIVER_NOT_AUTHORIZED';
      throw err;
    }
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

  public subscribeReceived(cb: (c: ReceivedMedicalCard) => void): Unsubscribe {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public async listReceived(): Promise<ReceivedMedicalCard[]> {
    if (!this.enabled) return [];

    return [
      {
        fromIdEphemeral: 'eph_victim_99',
        severity: 'ATRAPADO',
        receivedAt: new Date().toISOString(),
        position: { lat: 4.60971, lon: -74.08175, ts: new Date().toISOString() },
        profile: {
          bloodType: 'A+',
          allergies: ['Penicilina'],
          conditions: ['Asma'],
          contacts: [{ name: 'Juan Perez', phone: '+57 300 0000000', relation: 'Hermano' }],
        },
        incomplete: false,
        signatureValid: true,
      },
    ];
  }
}
