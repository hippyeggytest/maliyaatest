import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize the Supabase client with proper typing
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

// Export a function to get the Supabase client
export const getSupabaseClient = () => supabase;

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Connection test failed:', error);
    return { success: false, error };
  }
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return {
    error: error.message || 'An error occurred',
    details: error.details || null
  };
};

// Check if user has admin access
export const isAdmin = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Get current school ID from user metadata
export const getCurrentSchoolId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.school_id || null;
  } catch (error) {
    console.error('Error getting school ID:', error);
    return null;
  }
};

// Type guard for Supabase errors
export const isSupabaseError = (error: any): error is { message: string } => {
  return error && typeof error.message === 'string';
}; 