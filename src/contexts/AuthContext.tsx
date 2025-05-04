import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { User as AppUser } from '../types';

// Define your environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Define your context types
type AuthContextType = {
  session: any | null;
  user: AppUser | null;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
  isAdmin: () => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapSupabaseUserToAppUser = (supabaseUser: any | null): AppUser | null => {
    if (!supabaseUser) return null;
    return {
      id: parseInt(supabaseUser.id) || 0,
      username: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || '',
      role: supabaseUser.user_metadata?.role || 'student',
      email: supabaseUser.email || '',
      schoolId: supabaseUser.user_metadata?.school_id || null,
      grade: supabaseUser.user_metadata?.grade || null,
    };
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ? mapSupabaseUserToAppUser(currentSession.user) : null);
        setLoading(false);
      }
    );

    // Initial session check
    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ? mapSupabaseUserToAppUser(initialSession.user) : null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    session,
    user,
    signIn,
    signOut,
    loading,
    error,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
 