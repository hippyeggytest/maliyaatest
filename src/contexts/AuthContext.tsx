import  { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import db from '../db';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error('login function not implemented');
  },
  logout: () => {},
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // Check if the school is active for non-admin users
          if (parsedUser.schoolId && parsedUser.role !== 'admin') {
            const school = await db.schools.get(parsedUser.schoolId);
            
            // If school is inactive, don't log in the user
            if (school && school.status === 'inactive') {
              localStorage.removeItem('user');
              setUser(null);
              setError('المدرسة غير نشطة حالياً. يرجى التواصل مع مدير النظام.');
              setLoading(false);
              return;
            }
          }
          
          setUser(parsedUser);
        }
      } catch (err) {
        console.error('Failed to fetch user: ', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    setError(null);
    try {
      const user = await db.users.where({ username }).first();
      
      if (!user || user.password !== password) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
      
      // Check if school is active for non-admin users
      if (user.schoolId && user.role !== 'admin') {
        const school = await db.schools.get(user.schoolId);
        
        if (school && school.status === 'inactive') {
          throw new Error('المدرسة غير نشطة حالياً. يرجى التواصل مع مدير النظام.');
        }
      }
      
      // Remove password from stored user
      const { password: _, ...userWithoutPassword } = user;
      
      // Store in local storage
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      
      setUser(userWithoutPassword);
      return userWithoutPassword;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول';
      setError(error);
      throw new Error(error);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};
 