import  { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Schools } from './Schools';
import { Users } from './Users';
import { Subscriptions } from './Subscriptions';
import { Dashboard } from './Dashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../../supabase/supabaseClient';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { Navigate } from 'react-router-dom';
import { Book, Home, School, Users as UsersIcon, CreditCard, LogOut } from 'lucide-react';

const ControlCenter = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, logout } = useSupabaseAuth();
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    // Check Supabase connection
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('schools').select('id').limit(1);
        setServerStatus(error ? 'offline' : 'online');
      } catch (error) {
        setServerStatus('offline');
      }
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  }, []);

  // Redirect if not logged in or not admin
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-100 font-tajawal">
      <header className="bg-primary-700 text-white px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4 gap-3">
            <div className="bg-white p-1.5 rounded-md shadow-sm">
              <Book className="h-6 w-6 text-primary-700" />
            </div>
            <h1 className="text-xl font-bold">مركز التحكم | نظام إدارة مالية المدارس</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 text-xs rounded-full flex items-center ${
              serverStatus === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-1.5 ${
                serverStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
              } ${serverStatus === 'online' ? 'animate-pulse' : ''}`}></span>
              {serverStatus === 'online' ? 'متصل بالخادم' : 'غير متصل بالخادم'}
            </div>
            
            <div className="text-sm">
              {user.name} ({user.username})
            </div>
            
            <button 
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm flex items-center transition-colors"
            >
              <LogOut className="h-4 w-4 ml-1" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-6 px-4">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="bg-white shadow-sm rounded-lg p-1 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="schools" className="flex items-center gap-2">
              <School className="h-4 w-4" />
              المدارس
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              المستخدمين
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              الاشتراكات
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
          
          <TabsContent value="schools">
            <Schools />
          </TabsContent>
          
          <TabsContent value="users">
            <Users />
          </TabsContent>
          
          <TabsContent value="subscriptions">
            <Subscriptions />
          </TabsContent>
        </Tabs>
      </main>
      
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={true}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default ControlCenter;
 