import type { Services } from '../../contracts/container';
import { RealMeshService } from '../../core/mesh/meshService';
import { createRescuerAuthority } from './rescuerAuthority';
import { RealRescuerService } from '../../core/mesh/rescuerService';
import { NativeBleAdvertiserAdapter } from './bleAdvertiserAdapter';
import { BlePlxScannerAdapter } from './bleScannerAdapter';
import { PlatformGattExchangeAdapter } from './gattExchangeAdapter';

/**
 * Registra los servicios reales de BLE y malla P2P (RF-07, RF-08, RF-13) en el contenedor de la aplicación.
 */
export async function registerMesh(current: Services): Promise<Partial<Services>> {
  const advertiser = new NativeBleAdvertiserAdapter();
  const scannerWithBt = new BlePlxScannerAdapter();
  const gattAdapter = new PlatformGattExchangeAdapter();

  const meshService = new RealMeshService({
    advertiser,
    scanner: scannerWithBt,
    bluetoothState: scannerWithBt,
  });

  const rescuerService = new RealRescuerService({
    gattPort: gattAdapter,
    authority: await createRescuerAuthority(),
  });

  // Integración con el estado de emergencia para emitir baliza automáticamente (RF-07, RF-13)
  if (current.emergency) {
    current.emergency.subscribe(async (st) => {
      const isEmergencyActive = st.phase === 'ACTIVE';

      // Configurar proveedor de ficha médica si está armada
      if (st.medicalCardArmed && current.medical) {
        gattAdapter.serveMedicalCard(() => {
          // Si el perfil médico está disponible
          return {
            fromIdEphemeral: meshService.getCurrentEphemeralId(),
            severity: st.severity ?? 'ILESO',
            timestamp: Math.floor(Date.now() / 1000),
            hasLocation: Boolean(st.lastPosition),
            lat: st.lastPosition?.lat,
            lon: st.lastPosition?.lon,
            profile: {}, // Se llena con datos disponibles
            incomplete: false,
            signature: '0102030405060708',
          };
        });
      }

      await meshService.setBeaconState({
        active: isEmergencyActive && (st.beaconActive ?? true),
        severity: st.severity,
        location: st.lastPosition,
        lowPower: st.lowPower,
        medicalAvailable: st.medicalCardArmed,
      });
    });
  }

  // Iniciar el escaneo de la malla
  meshService.start().catch((err) => {
    console.warn('[MeshRegister] Error al iniciar escaneo de malla:', err);
  });

  return {
    mesh: meshService,
    rescuer: rescuerService,
  };
}
