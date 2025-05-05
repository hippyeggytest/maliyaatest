import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import SchoolDashboard from './pages/school/SchoolDashboard';
import ControlCenter from './pages/admin/ControlCenter';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    console.log('ProtectedRoute Debug:', {
      user,
      isAdmin: isAdmin(),
      requireAdmin,
      path: location.pathname,
      userRole: localStorage.getItem('userRole')
    });
  }, [user, isAdmin, requireAdmin, location]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    console.log('Redirecting non-admin user to school dashboard');
    return <Navigate to="/school/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    console.log('App Debug:', {
      user,
      isAdmin: isAdmin(),
      path: location.pathname,
      userRole: localStorage.getItem('userRole')
    });
  }, [user, isAdmin, location]);

  return (
    <div className="min-h-screen bg-gray-50 font-tajawal">
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        
        {/* School Portal Routes */}
        <Route
          path="/school/dashboard"
          element={
            <ProtectedRoute>
              <SchoolDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/students"
          element={
            <ProtectedRoute>
              <SchoolDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/fees"
          element={
            <ProtectedRoute>
              <SchoolDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/payments"
          element={
            <ProtectedRoute>
              <SchoolDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/reports"
          element={
            <ProtectedRoute>
              <SchoolDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/communication"
          element={
            <ProtectedRoute>
              <SchoolDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/settings"
          element={
            <ProtectedRoute>
              <SchoolDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Control Center Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <ControlCenter />
            </ProtectedRoute>
          }
        />
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

export default App;
 