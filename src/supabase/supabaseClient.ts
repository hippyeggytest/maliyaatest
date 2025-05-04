import { getSupabaseClient } from '../lib/supabase';
import type { Database } from './database.types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Helper functions for working with Supabase
export const fetchSchools = async () => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('schools')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching schools:', error);
    throw error;
  }
};

export const fetchUsers = async () => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select(`
        *,
        schools:school_id (
          name
        )
      `)
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const createSchool = async (schoolData: any) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('schools')
      .insert([schoolData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating school:', error);
    throw error;
  }
};

export const updateSchool = async (id: number, schoolData: any) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('schools')
      .update(schoolData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating school:', error);
    throw error;
  }
};

export const deleteSchool = async (id: number) => {
  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('schools')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting school:', error);
    throw error;
  }
};

export const createUser = async (userData: any) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id: number, userData: any) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id: number) => {
  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const fetchSubscriptions = async () => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('subscriptions')
      .select(`
        *,
        schools:school_id (
          name,
          logo
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
};

export const createSubscription = async (subscriptionData: any) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

export const updateSubscription = async (id: number, subscriptionData: any) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('subscriptions')
      .update(subscriptionData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

export const updateSchoolStatus = async (id: number, status: string) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('schools')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating school status:', error);
    throw error;
  }
};
 