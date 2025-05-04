import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { createBrowserClient } from '@supabase/ssr';
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
const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
 