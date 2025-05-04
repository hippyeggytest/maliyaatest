import { getSupabaseClient } from '../lib/supabase';
import type { Database } from '../supabase/database.types';

type TableName = keyof Database['public']['Tables'];

interface Filter {
  column: string;
  operator: string;
  value: any;
}

// Function to sync local data with Supabase when back online
export const syncToSupabase = async <T extends TableName>(
  entity: T,
  data: Database['public']['Tables'][T]['Insert'],
  operation: 'insert' | 'update' | 'delete'
) => {
  try {
    const client = getSupabaseClient();
    const { data: result, error } = await client
      .from(entity)
      [operation === 'delete' ? 'delete' : operation === 'update' ? 'update' : 'insert'](
        operation === 'delete' ? { id: data.id } : data
      )
      .select();

    if (error) throw error;
    return result as unknown as Database['public']['Tables'][T]['Row'][];
  } catch (error) {
    console.error(`Error syncing ${entity} to Supabase:`, error);
    throw error;
  }
};

// Function to fetch data from Supabase
export const fetchFromSupabase = async <T extends TableName>(
  entity: T,
  query?: {
    select?: string;
    filters?: Filter[];
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  }
) => {
  try {
    const client = getSupabaseClient();
    let queryBuilder = client.from(entity).select(query?.select || '*');
    
    if (query?.filters) {
      for (const filter of query.filters) {
        queryBuilder = queryBuilder.filter(filter.column, filter.operator, filter.value);
      }
    }
    
    if (query?.orderBy) {
      queryBuilder = queryBuilder.order(query.orderBy.column, { 
        ascending: query.orderBy.ascending 
      });
    }
    
    if (query?.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) throw error;
    return data as unknown as Database['public']['Tables'][T]['Row'][];
  } catch (error) {
    console.error(`Error fetching ${entity} from Supabase:`, error);
    throw error;
  }
};
 