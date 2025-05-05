import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { syncData } from '../utils/offlineSync';

interface ConnectionContextType {
  isConnected: boolean;
  lastSync: Date | null;
  error: string | null;
  checkConnection: () => Promise<void>;
  syncNow: () => Promise<void>;
  isInitialized: boolean;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.from('schools').select('id').limit(1);
      if (error) throw error;
      setIsConnected(true);
      setLastSync(new Date());
      setError(null);
    } catch (err: any) {
      setIsConnected(false);
      setError(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setIsInitialized(true);
    }
  };

  const syncNow = async () => {
    try {
      const result = await syncData();
      if (result.success) {
        setLastSync(new Date());
        setError(null);
      } else {
        throw new Error(result.error || 'فشل مزامنة البيانات');
      }
    } catch (err: any) {
      setError(err.message || 'فشل مزامنة البيانات');
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      syncNow();
    };

    const handleOffline = () => {
      setIsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value = {
    isConnected,
    lastSync,
    error,
    checkConnection,
    syncNow,
    isInitialized
  };

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  if (!context.isInitialized) {
    // Return a safe default state while initializing
    return {
      isConnected: false,
      lastSync: null,
      error: null,
      checkConnection: async () => {},
      syncNow: async () => {},
      isInitialized: false
    };
  }
  return context;
};
 