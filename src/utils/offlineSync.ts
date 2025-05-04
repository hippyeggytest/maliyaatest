import { supabase } from '../lib/supabase';
import { Database } from '../supabase/database.types';
import { SyncItem } from '../types';
import db from '../db';

type TableName = keyof Database['public']['Tables'];
type ChangeAction = 'create' | 'update' | 'delete';
type EntityType = 'school' | 'student' | 'fee' | 'payment' | 'user' | 'receipt' | 'installment' | 'messageTemplate';

interface PendingChange {
  id: string;
  table: TableName;
  action: ChangeAction;
  data: any;
}

// Process sync queue when online
export const processSyncQueue = async (): Promise<void> => {
  try {
    // Get all pending syncs - using 'no' as string value instead of undefined
    const pendingItems = await db.syncQueue
      .where('synced').equals('no')
      .toArray();

    if (pendingItems.length === 0) {
      return;
    }

    // Process each sync item
    for (const item of pendingItems) {
      try {
        // In a real implementation, this would send the data to the server
        // For now, we'll just mark it as synced
        await db.syncQueue.update(item.id!, { 
          synced: 'yes',
          syncedAt: new Date().toISOString() 
        });
      } catch (error) {
        console.error(`Failed to process sync item ${item.id}:`, error);
        // Could implement retry logic or alert the user here
      }
    }
  } catch (error) {
    console.error('Error processing sync queue:', error);
    throw error;
  }
};

// Add item to sync queue
export const addToSyncQueue = async (
  operation: ChangeAction,
  entity: EntityType,
  data: any,
  entityId?: number
): Promise<void> => {
  try {
    const syncItem: SyncItem = {
      operation,
      entity,
      entityId,
      data,
      timestamp: Date.now(),
      synced: 'no'
    };
    
    await db.syncQueue.add(syncItem);
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    throw error;
  }
};

// Initialize offline/online sync listener
export const initOfflineSync = () => {
  // Check if browser supports service workers
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful');
        })
        .catch((err) => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }
};

// Check for updates from server
export const checkForServerUpdates = async (): Promise<void> => {
  if (!navigator.onLine) return;
  
  try {
    // This is a placeholder for real server sync
    // In a real implementation, this would fetch updates from the server
    console.log('Checking for server updates...');
    // Add sync log entry
    await db.table('syncLog').add({
      entity: 'all',
      timestamp: Date.now(),
      count: 0
    });
  } catch (error) {
    console.error('Error checking for server updates:', error);
    throw error;
  }
};

export const syncData = async () => {
  try {
    // Get all pending changes from IndexedDB
    const pendingChanges = await getPendingChanges();
    
    // Process each change
    for (const change of pendingChanges) {
      const { table, action, data } = change;
      
      switch (action) {
        case 'create':
          await supabase.from(table).insert(data);
          break;
        case 'update':
          await supabase.from(table).update(data).eq('id', data.id);
          break;
        case 'delete':
          await supabase.from(table).delete().eq('id', data.id);
          break;
      }
      
      // Mark change as synced
      await markChangeAsSynced(change.id);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Sync failed:', error);
    return { success: false, error: error.message };
  }
};

const getPendingChanges = async (): Promise<PendingChange[]> => {
  try {
    const pendingItems = await db.syncQueue
      .where('synced')
      .equals('no')
      .toArray();
    
    return pendingItems.map(item => ({
      id: item.id?.toString() || '',
      table: item.entity as TableName,
      action: item.operation as ChangeAction,
      data: item.data
    }));
  } catch (error) {
    console.error('Error getting pending changes:', error);
    return [];
  }
};

const markChangeAsSynced = async (id: string): Promise<void> => {
  try {
    await db.syncQueue.update(parseInt(id), {
      synced: 'yes',
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking change as synced:', error);
    throw error;
  }
};
 