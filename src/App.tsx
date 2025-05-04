import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { testSupabaseAccess } from './lib/supabase';
import { useState } from 'react';

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to={requireAdmin ? '/admin/login' : '/login'} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

// School Portal Dashboard
function SchoolDashboard() {
  return <div>School Dashboard</div>;
}

// Control Center Dashboard
function AdminDashboard() {
  const [testResult, setTestResult] = useState<{
    anonKeyWorking: boolean;
    serviceKeyWorking: boolean;
    error?: any;
  } | null>(null);

  const runTest = async () => {
    const result = await testSupabaseAccess();
    setTestResult(result);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      
      <div className="mb-4">
        <button
          onClick={runTest}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Supabase Access
        </button>
      </div>

      {testResult && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Test Results:</h2>
          <div className="space-y-2">
            <p>
              Anon Key: 
              <span className={testResult.anonKeyWorking ? 'text-green-500' : 'text-red-500'}>
                {testResult.anonKeyWorking ? ' Working' : ' Not Working'}
              </span>
            </p>
            <p>
              Service Key: 
              <span className={testResult.serviceKeyWorking ? 'text-green-500' : 'text-red-500'}>
                {testResult.serviceKeyWorking ? ' Working' : ' Not Working'}
              </span>
            </p>
            {testResult.error && (
              <p className="text-red-500">
                Error: {testResult.error.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/admin/login" element={<LoginForm isAdminLogin />} />

          {/* School Portal Routes */}
          <Route
            path="/school/dashboard"
            element={
              <ProtectedRoute>
                <SchoolDashboard />
              </ProtectedRoute>
            }
          />

          {/* Control Center Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to appropriate login */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
 