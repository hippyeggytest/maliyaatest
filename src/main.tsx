import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ConnectionProvider } from './contexts/ConnectionContext';
import { initOfflineSync } from './utils/offlineSync';
import App from './App';
import './index.css';

// Initialize offline/online sync
initOfflineSync();

// Set document direction and language
document.documentElement.dir = 'rtl';
document.documentElement.lang = 'ar';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConnectionProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </ConnectionProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
 