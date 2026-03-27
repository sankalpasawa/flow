import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncAll } from '../lib/sync';
import { useAuthStore } from '../store/authStore';

export function useNetworkSync() {
  const [isConnected, setIsConnected] = useState(true);
  const user = useAuthStore((s) => s.user);
  const syncedOnReconnect = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);

      if (connected && !syncedOnReconnect.current && user) {
        syncedOnReconnect.current = true;
        syncAll(user.id).catch((err) => {
          console.error('[DayFlow] Background sync failed:', err);
        }).finally(() => {
          syncedOnReconnect.current = false;
        });
      }
    });
    return () => unsubscribe();
  }, [user]);

  return { isConnected };
}
