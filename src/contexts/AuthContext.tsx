import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { User as AppUser } from '../types';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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
    return session?.user?.user_metadata?.role === 'admin';
  };

  const handleAuthRedirect = (userRole: string) => {
    console.log('Handling auth redirect for role:', userRole);
    if (userRole === 'admin') {
      navigate('/admin');
    } else {
      navigate('/school/dashboard');
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session ? mapSupabaseUserToAppUser(session.user) : null);
        setLoading(false);

        // Handle initial redirect after login
        if (event === 'SIGNED_IN' && session?.user) {
          const role = session.user.user_metadata?.role;
          console.log('User signed in with role:', role);
          handleAuthRedirect(role);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setSession(data.session);
      setUser(data.session ? mapSupabaseUserToAppUser(data.session.user) : null);

      // Store user role in localStorage for debugging
      const role = data.session?.user?.user_metadata?.role;
      localStorage.setItem('userRole', role || '');

      // Redirect based on role
      handleAuthRedirect(role);

      return data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      localStorage.removeItem('userRole');
      navigate('/login');
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        signIn,
        signOut,
        loading,
        error,
        isAdmin,
      }}
    >
      {children}
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
 