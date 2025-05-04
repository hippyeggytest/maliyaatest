import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Supabase configuration with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase configuration. Please check your environment variables.');
}

// Initialize Supabase clients with error handling
let supabase: ReturnType<typeof createClient<Database>>;
let supabaseAdmin: ReturnType<typeof createClient<Database>>;

try {
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
    throw new Error('Service role key not configured. Cannot use admin client.');
  }
  return isAdmin ? supabaseAdmin : supabase;
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

// Test function to verify keys
export const testSupabaseAccess = async () => {
  try {
    // Test anon key access
    const { data: anonData, error: anonError } = await supabase
      .from('schools')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.error('Anon key access test failed:', anonError);
      return {
        anonKeyWorking: false,
        serviceKeyWorking: false,
        error: anonError
      };
    }

    // Test service key access if available
    if (supabaseAdmin) {
      const { data: serviceData, error: serviceError } = await supabaseAdmin
        .from('schools')
        .select('*')
        .limit(1);
      
      if (serviceError) {
        console.error('Service key access test failed:', serviceError);
        return {
          anonKeyWorking: true,
          serviceKeyWorking: false,
          error: serviceError
        };
      }
    }

    return {
      anonKeyWorking: true,
      serviceKeyWorking: !!supabaseAdmin
    };
  } catch (error) {
    console.error('Key test failed:', error);
    return {
      anonKeyWorking: false,
      serviceKeyWorking: false,
      error
    };
  }
}; 