import { useState, useEffect, useCallback } from 'react';
import { useServices } from './useServices';
import { EmergencyState, Severity } from '../../contracts/emergency';

const DEFAULT_STATE: EmergencyState = {
  phase: 'IDLE',
  lowPower: false,
  beaconActive: false,
  meshActive: false,
  medicalCardArmed: false,
};

export function useEmergency() {
  const { emergency } = useServices();
  const [state, setState] = useState<EmergencyState>(() => {
    try {
      return emergency.getState();
    } catch {
      return DEFAULT_STATE;
    }
  });

  useEffect(() => {
    const unsub = emergency.subscribe((newState) => {
      setState(newState);
    });
    return unsub;
  }, [emergency]);

  const requestPanic = useCallback(async () => {
    return emergency.requestPanic();
  }, [emergency]);

  const selectSeverity = useCallback(
    async (sev: Severity) => {
      await emergency.selectSeverity(sev);
    },
    [emergency]
  );

  const cancel = useCallback(async () => {
    await emergency.cancel();
  }, [emergency]);

  const stop = useCallback(async () => {
    await emergency.stop();
  }, [emergency]);

  const markSafe = useCallback(async () => {
    await emergency.markSafe();
  }, [emergency]);

  return {
    state,
    phase: state.phase,
    severity: state.severity,
    lowPower: state.lowPower,
    beaconActive: state.beaconActive,
    cancelDeadline: state.cancelDeadline,
    requestPanic,
    selectSeverity,
    cancel,
    stop,
    markSafe,
  };
}
