import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppContextType {
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
  syncStatus: 'idle' | 'syncing' | 'error';
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  pendingSyncs: number;
  setPendingSyncs: (count: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
  isConnected?: boolean;
  onSync?: () => Promise<void>;
}

export const AppProvider = ({ children, isConnected = true, onSync }: AppProviderProps) => {
  const [isOnline, setIsOnline] = useState(isConnected);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [pendingSyncs, setPendingSyncs] = useState(0);

  useEffect(() => {
    setIsOnline(isConnected);
  }, [isConnected]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (pendingSyncs > 0 && onSync) {
        setSyncStatus('syncing');
        onSync()
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
  }, [pendingSyncs, onSync]);

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
 