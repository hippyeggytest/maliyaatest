import  { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Users, CreditCard, Home, Database, Settings, Book } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useConnection } from '../contexts/ConnectionContext';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { isOnline, pendingSyncs, syncNow, syncStatus } = useConnection();

  const navigation = [
    { name: 'لوحة التحكم', href: '/admin/dashboard', icon: Home },
    { name: 'المدارس', href: '/admin/schools', icon: Database },
    { name: 'الاشتراكات', href: '/admin/subscriptions', icon: CreditCard },
    { name: 'المستخدمين', href: '/admin/users', icon: Users },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-tajawal">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 flex md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />

        <div className="relative flex flex-col flex-1 w-full max-w-xs pt-5 pb-4 bg-primary-700">
          <div className="absolute top-0 left-0 pt-2">
            <button
              className="flex items-center justify-center w-10 h-10 mr-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6 text-white" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="p-2 bg-white rounded-lg shadow-lg">
                <Book className="h-8 w-8 text-primary-700" />
              </div>
              <span className="mr-3 text-lg font-bold text-white">نظام المالية</span>
            </div>
          </div>
          
          <div className="flex-1 h-0 mt-5 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      isActive
                        ? 'bg-primary-800 text-white'
                        : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                    }`}
                  >
                    <item.icon
                      className={`mr-4 h-6 w-6 ${
                        isActive ? 'text-primary-300' : 'text-primary-300 group-hover:text-primary-200'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-1 min-h-0 bg-primary-700">
            <div className="flex items-center flex-shrink-0 h-16 px-4 bg-primary-800">
              <div className="flex items-center">
                <div className="p-1 bg-white rounded-lg shadow-lg">
                  <Book className="h-7 w-7 text-primary-700" />
                </div>
                <span className="mr-3 text-lg font-bold text-white">نظام المالية</span>
              </div>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-primary-800 text-white'
                          : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                      }`}
                    >
                      <item.icon
                        className={`ml-3 mr-2 h-5 w-5 ${
                          isActive ? 'text-primary-300' : 'text-primary-300 group-hover:text-primary-200'
                        }`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="border-t border-primary-800 p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-primary-100 rounded-md hover:bg-primary-600 hover:text-white"
              >
                <LogOut className="mr-3 h-5 w-5" />
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <div className="pt-1 pr-1 md:hidden">
          <button
            className="flex items-center justify-center w-12 h-12 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          <div className="flex items-center justify-between shadow-md border-b border-gray-200 px-4 py-4 bg-white sm:px-6 lg:px-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-medium leading-6 text-gray-900">
                {navigation.find((item) => pathname.startsWith(item.href))?.name || 'مركز التحكم'}
              </h1>
            </div>
            <div className="flex items-center space-x-3 gap-2">
              {!isOnline && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-red-100 text-red-800">
                  غير متصل
                </span>
              )}
              
              {pendingSyncs > 0 && (
                <button
                  onClick={syncNow}
                  disabled={!isOnline || syncStatus === 'syncing'}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {syncStatus === 'syncing' ? 'جاري المزامنة...' : `مزامنة (${pendingSyncs})`}
                </button>
              )}
            </div>
          </div>
          
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
 