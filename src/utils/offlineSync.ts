import  db from '../db';
import { SyncItem } from '../types';

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
  operation: 'create' | 'update' | 'delete',
  entity: string,
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
      synced: 'no' // Use 'no' as string value instead of undefined
    };
    
    await db.syncQueue.add(syncItem);
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    throw error;
  }
};

// Initialize offline/online sync listener
export const initOfflineSync = (): void => {
  window.addEventListener('online', async () => {
    console.log('Back online, syncing data...');
    try {
      await processSyncQueue();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  });

  // Auto-sync periodically if online
  setInterval(async () => {
    if (navigator.onLine) {
      try {
        await processSyncQueue();
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes
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
 