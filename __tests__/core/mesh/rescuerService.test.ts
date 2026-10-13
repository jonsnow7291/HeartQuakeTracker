import { RealRescuerService } from '../../../src/core/mesh/rescuerService';
import { MedicalCardWirePayload } from '../../../src/core/mesh/types';
import { FakeClock } from '../support/nodePorts';
import { AppException } from '../../../src/contracts/types';
import { autoridadCon, CODIGO_VALIDO, CODIGO_OTRO } from '../support/rescuerList';

describe('RealRescuerService (RF-13, D-06)', () => {
  let clock: FakeClock;
  let service: RealRescuerService;

  beforeEach(() => {
    clock = new FakeClock(1_776_000_000_000);
    service = new RealRescuerService({ clock, authority: autoridadCon([CODIGO_VALIDO, CODIGO_OTRO]) });
  });

  it('indica que el modo socorrista está disponible en la app', () => {
    expect(service.isRescuerModeAvailable()).toBe(true);
    expect(service.isEnabled()).toBe(false);
  });

  it('habilita el modo con credencial autorizada (lista firmada)', async () => {
    await service.enable({ code: CODIGO_VALIDO });
    expect(service.isEnabled()).toBe(true);
  });

  it('rechaza credencial no autorizada con RECEIVER_NOT_AUTHORIZED', async () => {
    await expect(service.enable({ code: 'INV-AAAA-BBBB-CCCC' })).rejects.toThrow(AppException);

    try {
      await service.enable({ code: 'INV-AAAA-BBBB-CCCC' });
    } catch (err: any) {
      expect(err.code).toBe('RECEIVER_NOT_AUTHORIZED');
    }

    expect(service.isEnabled()).toBe(false);
  });

  it('deshabilita el modo socorrista y vacía listReceived()', async () => {
    await service.enable({ code: CODIGO_OTRO });
    service.disable();
    expect(service.isEnabled()).toBe(false);
    expect(await service.listReceived()).toEqual([]);
  });

  it('procesa una ficha médica completa marcando incomplete=false y signatureValid=true (RF-13)', async () => {
    await service.enable({ code: CODIGO_VALIDO });

    const receivedEvents: any[] = [];
    service.subscribeReceived((card) => {
      receivedEvents.push(card);
    });

    const fullPayload: MedicalCardWirePayload = {
      fromIdEphemeral: 'victim_eph_123',
      severity: 'ATRAPADO',
      timestamp: Math.floor(clock.now() / 1000),
      hasLocation: true,
      lat: 4.60971,
      lon: -74.08175,
      profile: {
        bloodType: 'O+',
        allergies: ['Penicilina'],
        conditions: ['Hipertensión'],
        contacts: [{ name: 'Carlos Gomez', phone: '+57 300 1234567', relation: 'Hermano' }],
      },
      incomplete: false,
      signature: '1234567890abcdef',
    };

    const card = service.ingestReceivedCard(fullPayload);

    expect(card.fromIdEphemeral).toBe('victim_eph_123');
    expect(card.severity).toBe('ATRAPADO');
    expect(card.incomplete).toBe(false);
    expect(card.signatureValid).toBe(true);
    expect(card.position?.lat).toBe(4.60971);
    expect(card.position?.lon).toBe(-74.08175);

    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0]).toEqual(card);

    const list = await service.listReceived();
    expect(list.length).toBe(1);
    expect(list[0]).toEqual(card);
  });

  it('detecta ficha médica incompleta si faltan sangre o contactos', async () => {
    await service.enable({ code: CODIGO_VALIDO });

    const partialPayload: MedicalCardWirePayload = {
      fromIdEphemeral: 'victim_eph_456',
      severity: 'CON_LESIONES',
      timestamp: Math.floor(clock.now() / 1000),
      hasLocation: false,
      profile: {
        allergies: ['Polvo'],
        conditions: [],
        contacts: [], // Sin contactos
      },
      incomplete: false,
      signature: 'abcdef1234567890',
    };

    const card = service.ingestReceivedCard(partialPayload);
    expect(card.incomplete).toBe(true);
  });
});
