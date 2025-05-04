import  { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { School, AppContextType } from '../types';
import { useAuth } from './AuthContext';
import db from '../db';

const AppContext = createContext<AppContextType>({
  currentSchool: null,
  setCurrentSchool: () => {},
});

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadSchool = async () => {
      if (user?.schoolId) {
        try {
          const school = await db.schools.get(user.schoolId);
          if (school) {
            setCurrentSchool(school);
          }
        } catch (error) {
          console.error('Failed to load school data', error);
        }
      } else if (user?.role === 'admin') {
        // For admin, we might want to load the first school or none
        try {
          const school = await db.schools.orderBy('id').first();
          if (school) {
            setCurrentSchool(school);
          }
        } catch (error) {
          console.error('Failed to load any school data', error);
        }
      }
    };

    if (user) {
      loadSchool();
    } else {
      setCurrentSchool(null);
    }
  }, [user]);

  return (
    <AppContext.Provider value={{ currentSchool, setCurrentSchool }}>
      {children}
    </AppContext.Provider>
  );
};
 