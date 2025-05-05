import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { ConnectionProvider } from './contexts/ConnectionContext'
import { useConnection } from './contexts/ConnectionContext'
import './index.css'

// Set document direction and language
document.documentElement.dir = 'rtl'
document.documentElement.lang = 'ar'

// Wrapper component to connect ConnectionProvider with AppProvider
const AppWithConnection = () => {
  const { isConnected, syncNow } = useConnection();
  
  return (
    <AppProvider isConnected={isConnected} onSync={syncNow}>
      <App />
    </AppProvider>
  );
};

// Error boundary for initialization
try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <ConnectionProvider>
          <AuthProvider>
            <AppWithConnection />
          </AuthProvider>
        </ConnectionProvider>
      </BrowserRouter>
    </React.StrictMode>
  )
} catch (error) {
  console.error('Failed to initialize application:', error)
  document.getElementById('root')!.innerHTML = `
    <div style="text-align: center; padding: 20px; font-family: Tajawal, sans-serif;">
      <h1>حدث خطأ في تحميل التطبيق</h1>
      <p>يرجى تحديث الصفحة أو المحاولة مرة أخرى لاحقاً</p>
    </div>
  `
}
 