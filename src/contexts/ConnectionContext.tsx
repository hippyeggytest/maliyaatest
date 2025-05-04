import  { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConnectionContextType } from '../types';
import db from '../db';
import { processSyncQueue, checkForServerUpdates } from '../utils/offlineSync';

const ConnectionContext = createContext<ConnectionContextType>({
  isOnline: navigator.onLine,
  syncStatus: 'idle',
  pendingSyncs: 0,
  syncNow: async () => {},
});

export const useConnection = () => useContext(ConnectionContext);

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [pendingSyncs, setPendingSyncs] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncNow();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkPendingSyncs = async () => {
      try {
        // Fix: Use string comparisons for synced property, not comparing to undefined
        const count = await db.syncQueue.where('synced').equals('no').count();
        setPendingSyncs(count);
      } catch (error) {
        console.error('Error checking pending syncs:', error);
      }
    };

    // Check pending syncs initially and periodically
    checkPendingSyncs();
    const interval = setInterval(checkPendingSyncs, 5000);

    // Also check for server updates when online
    if (isOnline) {
      checkForServerUpdates().catch(console.error);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  const syncNow = async () => {
    if (!isOnline || syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    try {
      await processSyncQueue();
      // Also fetch new data from the server
      await checkForServerUpdates();
      setPendingSyncs(0);
      setSyncStatus('idle');
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  };

  return (
    <ConnectionContext.Provider value={{ isOnline, syncStatus, pendingSyncs, syncNow }}>
      {children}
      <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? 'متصل بالانترنت' : 'غير متصل بالانترنت - وضع العمل دون اتصال'}
      </div>
    </ConnectionContext.Provider>
  );
};
 