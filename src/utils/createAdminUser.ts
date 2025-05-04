import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const createAdminUser = async (email: string, password: string) => {
  try {
    // Create the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    });

    if (authError) throw authError;

    console.log('Admin user created successfully:', authData.user);
    return authData.user;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}; 