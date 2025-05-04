import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY?.trim();

console.log('Environment Variables:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey,
  urlLength: supabaseUrl?.length,
  anonKeyLength: supabaseAnonKey?.length,
  serviceKeyLength: supabaseServiceKey?.length
});

// Initialize clients
let supabase: ReturnType<typeof createClient<Database>>;
let supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase configuration');
  }

  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  if (supabaseServiceKey) {
    supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
} catch (error) {
  console.error('Failed to initialize Supabase clients:', error);
  throw error;
}

// Helper function to get the appropriate client based on context
export const getSupabaseClient = (isAdmin: boolean = false) => {
  if (isAdmin && !supabaseAdmin) {
    console.warn('Admin client not available. Falling back to regular client.');
    return supabase;
  }
  return isAdmin ? supabaseAdmin! : supabase;
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

// Test function to verify connection
export const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('schools').select('*').limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      return { success: false, error };
    }
    
    console.log('Connection test successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Connection test error:', error);
    return { success: false, error };
  }
};

// Export the clients
export { supabase, supabaseAdmin }; 