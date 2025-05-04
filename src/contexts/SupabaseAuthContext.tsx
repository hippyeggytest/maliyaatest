import  React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { User } from '../types';

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

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const storedUser = localStorage.getItem('sb-user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (err) {
      console.error('Failed to fetch user: ', err);
    } finally {
      setLoading(false);
    }
  }

  const login = async (username: string, password: string): Promise<User> => {
    setError(null);
    try {
      // In production, you would use Supabase Auth, but here we'll simulate it
      // Using RLS policies in Supabase, you'd secure your tables
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password) // In production, you'd never store passwords plaintext
        .single();
      
      if (error || !data) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }

      // Check if school is active for non-admin users
      if (data.school_id && data.role !== 'admin') {
        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .select('status')
          .eq('id', data.school_id)
          .single();
        
        if (schoolError || !school) {
          throw new Error('المدرسة غير موجودة');
        }
        
        if (school.status === 'inactive') {
          throw new Error('المدرسة غير نشطة حالياً. يرجى التواصل مع مدير النظام.');
        }
      }

      // Transform to our User type
      const userRecord: User = {
        id: data.id,
        username: data.username,
        name: data.name,
        role: data.role,
        email: data.email,
        schoolId: data.school_id,
        grade: data.grade
      };
      
      localStorage.setItem('sb-user', JSON.stringify(userRecord));
      setUser(userRecord);
      return userRecord;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول';
      setError(error);
      throw new Error(error);
    }
  };

  const logout = () => {
    localStorage.removeItem('sb-user');
    setUser(null);
  };

  return (
    <SupabaseAuthContext.Provider value={{ user, loading, login, logout, error }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
 