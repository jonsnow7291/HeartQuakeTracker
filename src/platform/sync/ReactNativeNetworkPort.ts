import NetInfo from '@react-native-community/netinfo';
import type { Unsubscribe } from '../../contracts/types';
import type { NetworkPort } from '../../core/sync/ports';

/**
 * Adaptador de estado de red sobre @react-native-community/netinfo (RF-12).
 */
export class ReactNativeNetworkPort implements NetworkPort {
  async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return Boolean(state.isConnected && state.isInternetReachable !== false);
    } catch {
      return false;
    }
  }

  subscribe(cb: (online: boolean) => void): Unsubscribe {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      cb(online);
    });
    return () => {
      unsubscribe();
    };
  }
}
