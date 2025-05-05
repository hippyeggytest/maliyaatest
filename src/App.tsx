import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import SchoolDashboard from './pages/school/SchoolDashboard';
import ControlCenter from './pages/admin/ControlCenter';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/school/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => {
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
 