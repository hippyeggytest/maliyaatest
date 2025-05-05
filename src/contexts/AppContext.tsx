import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useConnection } from './ConnectionContext';

interface AppContextType {
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
  syncStatus: 'idle' | 'syncing' | 'error';
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  pendingSyncs: number;
  setPendingSyncs: (count: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [pendingSyncs, setPendingSyncs] = useState(0);
  
  // Safely get connection context
  let isConnected = true;
  let syncNow = async () => {};
  
  try {
    const connection = useConnection();
    isConnected = connection.isConnected;
    syncNow = connection.syncNow;
  } catch (error) {
    console.warn('ConnectionProvider not available:', error);
  }

  useEffect(() => {
    setIsOnline(isConnected);
  }, [isConnected]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (pendingSyncs > 0) {
        setSyncStatus('syncing');
        syncNow()
          .then(() => {
            setSyncStatus('idle');
            setPendingSyncs(0);
          })
          .catch(() => {
            setSyncStatus('error');
          });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingSyncs, syncNow]);

  const value = {
    isOnline,
    setIsOnline,
    syncStatus,
    setSyncStatus,
    pendingSyncs,
    setPendingSyncs
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
 