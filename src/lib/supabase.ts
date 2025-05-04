import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types';

// Supabase configuration with fallback values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY?.trim() || '';

console.log('Environment Variables:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey,
  urlLength: supabaseUrl?.length,
  anonKeyLength: supabaseAnonKey?.length,
  serviceKeyLength: supabaseServiceKey?.length
});

// Initialize single client instance
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Initialize admin client only if service key is available
const supabaseAdmin = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Export the clients
export { supabase, supabaseAdmin };

// Helper function to get the appropriate client based on context
export const getSupabaseClient = (isAdmin: boolean = false) => {
  return isAdmin && supabaseAdmin ? supabaseAdmin : supabase;
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return {
    error: error.message || 'An error occurred',
    details: error.details || null
  };
};

// Helper function to check if user has admin access
export const isAdmin = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user?.user_metadata?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Helper function to get current school ID
export const getCurrentSchoolId = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user?.user_metadata?.school_id;
  } catch (error) {
    console.error('Error getting school ID:', error);
    return null;
  }
};

// Type guard for Supabase error
export const isSupabaseError = (error: any): error is { message: string } => {
  return error && typeof error.message === 'string';
};

// Helper function to test Supabase connection
export const testConnection = async () => {
  try {
    const { error } = await supabase.from('schools').select('id').limit(1);
    return {
      success: !error,
      error: error ? handleSupabaseError(error) : null
    };
  } catch (error) {
    return {
      success: false,
      error: handleSupabaseError(error)
    };
  }
}; 