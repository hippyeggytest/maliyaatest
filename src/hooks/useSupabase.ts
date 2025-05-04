import  { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { toast } from 'react-toastify';

export function useSupabase<T>(tableName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchAll = async (options?: { select?: string; orderBy?: string; order?: 'asc' | 'desc' }) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase.from(tableName).select(options?.select || '*');
      
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.order === 'asc' });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as T[];
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error(`Failed to fetch data: ${error.message}`);
      return [] as T[];
    } finally {
      setLoading(false);
    }
  };
  
  const fetchById = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as T;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error(`Failed to fetch item: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const create = async (item: Partial<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert([item])
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Item created successfully');
      return data as T;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error(`Failed to create item: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const update = async (id: number, item: Partial<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .update(item)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Item updated successfully');
      return data as T;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error(`Failed to update item: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const remove = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Item deleted successfully');
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      toast.error(`Failed to delete item: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    fetchAll,
    fetchById,
    create,
    update,
    remove,
  };
}
 