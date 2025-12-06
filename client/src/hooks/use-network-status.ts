import { useState, useEffect, useCallback } from 'react';
import { syncService } from '@/lib/sync-service';

export type NetworkStatus = 'online' | 'offline' | 'syncing';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'offline'>('idle');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = syncService.addStatusListener((status) => {
      setSyncStatus(status);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const triggerSync = useCallback(async () => {
    return await syncService.triggerSync();
  }, []);

  const getStatus = useCallback((): NetworkStatus => {
    if (!isOnline) return 'offline';
    if (syncStatus === 'syncing') return 'syncing';
    return 'online';
  }, [isOnline, syncStatus]);

  return {
    isOnline,
    syncStatus,
    status: getStatus(),
    triggerSync,
    startAutoSync: (interval?: number) => syncService.startAutoSync(interval),
    stopAutoSync: () => syncService.stopAutoSync(),
  };
}
