import  { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Users, File, Home, CreditCard, FileText, Settings, MessageCircle, Book } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useConnection } from '../contexts/ConnectionContext';

const SchoolLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const { currentSchool } = useApp();
  const navigate = useNavigate();
  const { isOnline, pendingSyncs, syncNow, syncStatus } = useConnection();

  const navigation = [
    { name: 'لوحة التحكم', href: '/school/dashboard', icon: Home, roles: ['main-supervisor', 'grade-supervisor'] },
    { name: 'الطلاب', href: '/school/students', icon: Users, roles: ['main-supervisor', 'grade-supervisor'] },
    { name: 'الرسوم', href: '/school/fees', icon: File, roles: ['main-supervisor', 'grade-supervisor'] },
    { name: 'المدفوعات', href: '/school/payments', icon: CreditCard, roles: ['main-supervisor', 'grade-supervisor'] },
    { name: 'التواصل', href: '/school/communication', icon: MessageCircle, roles: ['main-supervisor', 'grade-supervisor'] },
    { name: 'التقارير', href: '/school/reports', icon: FileText, roles: ['main-supervisor'] },
    { name: 'الإعدادات', href: '/school/settings', icon: Settings, roles: ['main-supervisor'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || '')
  );

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-tajawal">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 flex md:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={() => setSidebarOpen(false)} />

        <div className="relative flex flex-col flex-1 w-full max-w-xs pt-5 pb-4 bg-gradient-to-b from-primary-800 to-primary-700">
          <div className="absolute top-0 left-0 pt-2">
            <button
              className="flex items-center justify-center w-10 h-10 mr-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6 text-white" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col items-center flex-shrink-0 px-4">
            {currentSchool?.logo ? (
              <img
                className="h-16 w-16 rounded-full shadow-lg border-2 border-white mb-2 object-cover"
                src={currentSchool.logo}
                alt={currentSchool.name}
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold mb-2 shadow-lg border-2 border-white">
                {currentSchool?.name?.charAt(0) || <Book className="h-8 w-8" />}
              </div>
            )}
            <span className="text-white font-medium text-base mt-2">{currentSchool?.name}</span>
            {user?.role === 'grade-supervisor' && user?.grade && (
              <span className="text-white/80 text-xs mt-1 bg-primary-900/30 px-3 py-1 rounded-full">
                {user.grade}
              </span>
            )}
          </div>
          
          <div className="flex-1 h-0 mt-6 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
                      isActive
                        ? 'bg-primary-900/50 text-white'
                        : 'text-primary-100 hover:bg-primary-900/20 hover:text-white'
                    } transition-colors`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? 'text-white' : 'text-primary-200 group-hover:text-white'
                      } transition-colors`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="px-4 py-4 bg-primary-900/20">
            <button
              onClick={() => {
                handleLogout();
                setSidebarOpen(false);
              }}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-primary-100 rounded-md hover:bg-primary-900/30 hover:text-white transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-1 min-h-0 bg-gradient-to-b from-primary-800 to-primary-700">
            <div className="flex flex-col items-center flex-shrink-0 h-auto px-4 py-6 bg-primary-900/20">
              {currentSchool?.logo ? (
                <img
                  className="h-20 w-20 rounded-full shadow-lg border-2 border-white object-cover"
                  src={currentSchool.logo || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmFiaWMlMjBzY2hvb2wlMjBtYW5hZ2VtZW50JTIwZmluYW5jZXxlbnwwfHx8fDE3NDYyNzcyNjB8MA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800'}
                  alt={currentSchool.name}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold shadow-lg border-2 border-white">
                  {currentSchool?.name?.charAt(0) || <Book className="h-10 w-10" />}
                </div>
              )}
              <span className="text-white font-medium text-lg mt-3">{currentSchool?.name}</span>
              {user?.role === 'grade-supervisor' && user?.grade && (
                <span className="text-white/80 text-xs mt-2 bg-primary-900/30 px-3 py-1 rounded-full">
                  {user.grade}
                </span>
              )}
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto mt-4 px-2">
              <nav className="flex-1 space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
                        isActive
                          ? 'bg-primary-900/50 text-white'
                          : 'text-primary-100 hover:bg-primary-900/20 hover:text-white'
                      } transition-colors`}
                    >
                      <item.icon
                        className={`ml-2 mr-3 h-5 w-5 ${
                          isActive ? 'text-white' : 'text-primary-200 group-hover:text-white'
                        } transition-colors`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="px-4 py-4 bg-primary-900/20">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-primary-100 rounded-lg hover:bg-primary-900/30 hover:text-white transition-colors"
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
        <div className="relative z-10 flex items-center justify-between shadow-sm border-b border-gray-200 px-4 py-3 bg-white sm:px-6 lg:px-8">
          <div className="flex-1 min-w-0 flex items-center">
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>
            <div className="mr-2 md:mr-0">
              <h1 className="text-lg font-medium leading-6 text-gray-900">
                {filteredNavigation.find((item) => pathname.startsWith(item.href))?.name || 'بوابة المدرسة'}
              </h1>
              {user?.role === 'grade-supervisor' && user?.grade && (
                <p className="text-sm text-gray-500">
                  {user.grade}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isOnline && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
                غير متصل
              </span>
            )}
            
            {pendingSyncs > 0 && (
              <button
                onClick={syncNow}
                disabled={!isOnline || syncStatus === 'syncing'}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              >
                {syncStatus === 'syncing' ? 'جاري المزامنة...' : `مزامنة (${pendingSyncs})`}
              </button>
            )}
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SchoolLayout;
 