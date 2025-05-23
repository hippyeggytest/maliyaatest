import { getSupabaseClient } from '../lib/supabase';
import type { Database } from '../types/supabase';

export const useSupabase = () => {
  const client = getSupabaseClient();

  const fetch = async <T extends keyof Database['public']['Tables']>(
    table: T,
    query?: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
    }
  ) => {
    try {
      if (!table || typeof table !== 'string') {
        throw new Error('Invalid table name');
      }

      let queryBuilder = client.from(table).select(query?.select || '*');

      if (query?.filters) {
        for (const [key, value] of Object.entries(query.filters)) {
          if (value !== undefined && value !== null) {
            queryBuilder = queryBuilder.eq(key, value);
          }
        }
      }

      if (query?.orderBy) {
        queryBuilder = queryBuilder.order(query.orderBy.column, {
          ascending: query.orderBy.ascending ?? true,
        });
      }

      if (query?.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching from ${String(table)}:`, error);
      throw error;
    }
  };

  const create = async <T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Insert']
  ) => {
    try {
      if (!table || typeof table !== 'string') {
        throw new Error('Invalid table name');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data object');
      }

      // Check if user is authenticated
      const { data: { session }, error: authError } = await client.auth.getSession();
      if (authError) throw authError;
      if (!session) throw new Error('User must be authenticated to create a school');

      const { data: result, error } = await client
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Error creating in ${String(table)}:`, error);
      throw error;
    }
  };

  const update = async <T extends keyof Database['public']['Tables']>(
    table: T,
    id: number,
    data: Partial<Database['public']['Tables'][T]['Update']>
  ) => {
    try {
      if (!table || typeof table !== 'string') {
        throw new Error('Invalid table name');
      }

      if (!id || typeof id !== 'number') {
        throw new Error('Invalid ID');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data object');
      }

      const { data: result, error } = await client
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Error updating in ${String(table)}:`, error);
      throw error;
    }
  };

  const remove = async <T extends keyof Database['public']['Tables']>(
    table: T,
    id: number
  ) => {
    try {
      if (!table || typeof table !== 'string') {
        throw new Error('Invalid table name');
      }

      if (!id || typeof id !== 'number') {
        throw new Error('Invalid ID');
      }

      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting from ${String(table)}:`, error);
      throw error;
    }
  };

  return {
    fetch,
    create,
    update,
    remove
  };
};
 