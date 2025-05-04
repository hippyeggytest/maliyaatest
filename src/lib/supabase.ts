import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Supabase configuration
const supabaseUrl = 'https://solezwaiwjujyokzfxue.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbGV6d2Fpd2p1anlva3pmeHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNzA1NzMsImV4cCI6MjA2MTk0NjU3M30.wgePv_GApMCOSiZMwJLMO_oAQ7ABcp7bw5yxzZzrxsI';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbGV6d2Fpd2p1anlva3pmeHVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjM3MDU3MywiZXhwIjoyMDYxOTQ2NTczfQ.JXMiVbevATiB6semZOeZ7s7tGy-5FIERFYfW_KOydQo';

// Client for School Portal (uses anon key)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Client for Control Center (uses service key)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Helper function to get the appropriate client based on context
export const getSupabaseClient = (isAdmin: boolean = false) => {
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
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.role === 'admin';
};

// Helper function to get current school ID
export const getCurrentSchoolId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.school_id;
};

// Type guard for Supabase error
export const isSupabaseError = (error: any): error is { message: string } => {
  return error && typeof error.message === 'string';
};

// Test function to verify keys
export const testSupabaseAccess = async () => {
  try {
    // Test anon key access (should be restricted)
    const { data: anonData, error: anonError } = await supabase
      .from('schools')
      .select('*')
      .limit(1);
    
    if (anonError) {
      console.log('Anon key access test passed (expected restricted access)');
    }

    // Test service key access (should have full access)
    const { data: serviceData, error: serviceError } = await supabaseAdmin
      .from('schools')
      .select('*')
      .limit(1);
    
    if (!serviceError && serviceData) {
      console.log('Service key access test passed (has full access)');
    } else {
      throw new Error('Service key does not have proper access');
    }

    return {
      anonKeyWorking: true,
      serviceKeyWorking: true
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