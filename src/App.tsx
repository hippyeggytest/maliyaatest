import  { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ConnectionProvider } from './contexts/ConnectionContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import SchoolLayout from './layouts/SchoolLayout';
import AuthLayout from './layouts/AuthLayout';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Schools from './pages/admin/Schools';
import Subscriptions from './pages/admin/Subscriptions';
import Users from './pages/admin/Users';

// School Pages
import SchoolDashboard from './pages/school/Dashboard';
import Students from './pages/school/Students';
import Fees from './pages/school/Fees';
import Payments from './pages/school/Payments';
import Reports from './pages/school/Reports';
import Settings from './pages/school/Settings';
import Communication from './pages/school/Communication';

// Auth Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';

// Other
import NotFound from './pages/NotFound';
import { initDb } from './db';

function App() {
  const { user, loading } = useAuth();
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initDb();
      setDbInitialized(true);
    };
    init();
  }, []);

  if (loading || !dbInitialized) {
    return (
      <div className="flex w-full h-screen items-center justify-center flex-col space-y-3 p-2">
        <span className="loader" />
        <div className="text-base font-semibold text-gray-800">
          جاري تحميل النظام...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="" element={<Navigate to="/auth/login" replace />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          user && user.role === 'admin' ? (
            <AdminLayout />
          ) : (
            <Navigate to="/auth/login" replace />
          )
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="schools" element={<Schools />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="users" element={<Users />} />
        <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* School Routes */}
      <Route
        path="/school"
        element={
          user && (user.role === 'main-supervisor' || user.role === 'grade-supervisor') ? (
            <SchoolLayout />
          ) : (
            <Navigate to="/auth/login" replace />
          )
        }
      >
        <Route path="dashboard" element={<SchoolDashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="fees" element={<Fees />} />
        <Route path="payments" element={<Payments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="communication" element={<Communication />} />
        <Route path="" element={<Navigate to="/school/dashboard" replace />} />
      </Route>

      {/* Root Route */}
      <Route
        path="/"
        element={
          user ? (
            user.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/school/dashboard" replace />
            )
          ) : (
            <Navigate to="/auth/login" replace />
          )
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
 