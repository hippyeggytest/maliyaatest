import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { User } from '../types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
}

const SupabaseAuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {
    throw new Error('login function not implemented');
  },
  logout: () => {},
});

export const useSupabaseAuth = () => useContext(SupabaseAuthContext);

const convertSupabaseUserToAppUser = (supabaseUser: SupabaseUser): User => {
  return {
    id: parseInt(supabaseUser.id, 10),
    username: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.full_name || '',
    role: supabaseUser.user_metadata?.role || 'user',
    email: supabaseUser.email || '',
    schoolId: supabaseUser.user_metadata?.school_id || null,
    grade: supabaseUser.user_metadata?.grade || null,
  };
};

export const SupabaseAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseClient();
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(convertSupabaseUserToAppUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: username,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from login');

      const appUser = convertSupabaseUserToAppUser(data.user);
      setUser(appUser);
      return appUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
      throw err;
    }
  };

  const logout = async () => {
    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during logout');
    }
  };

  return (
    <SupabaseAuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
 