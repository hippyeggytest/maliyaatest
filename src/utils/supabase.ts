import  { createClient } from '@supabase/supabase-js';

// Create a Supabase client configured to work in offline mode
const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Function to sync local data with Supabase when back online
export const syncToSupabase = async (entity: string, data: any, operation: 'insert' | 'update' | 'delete') => {
  try {
    const { data: result, error } = await supabase
      .from(entity)
      [operation === 'delete' ? 'delete' : operation === 'update' ? 'update' : 'insert'](
        operation === 'delete' ? { id: data.id } : data
      )
      .select();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error(`Error syncing ${entity} to Supabase:`, error);
    throw error;
  }
};

// Function to fetch data from Supabase
export const fetchFromSupabase = async (entity: string, query?: any) => {
  try {
    let queryBuilder = supabase.from(entity).select('*');
    
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
    return data;
  } catch (error) {
    console.error(`Error fetching ${entity} from Supabase:`, error);
    throw error;
  }
};
 