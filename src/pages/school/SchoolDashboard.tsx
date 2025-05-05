import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import Students from './Students';
import Fees from './Fees';
import Payments from './Payments';
import Reports from './Reports';
import Communication from './Communication';
import Settings from './Settings';
import { Users, CreditCard, BarChart, MessageSquare, Settings as SettingsIcon, LogOut } from 'lucide-react';

const SchoolDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname.split('/').pop();
    return path || 'dashboard';
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/school/${value}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-tajawal">
      <header className="bg-primary-700 text-white px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4 gap-3">
            <div className="bg-white p-1.5 rounded-md shadow-sm">
              <Users className="h-6 w-6 text-primary-700" />
            </div>
            <h1 className="text-xl font-bold">نظام إدارة مالية المدارس</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm">
              {user?.name} ({user?.email})
            </div>
            
            <button 
              onClick={signOut}
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
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="bg-white shadow-sm rounded-lg p-1 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              الطلاب
            </TabsTrigger>
            <TabsTrigger value="fees" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              الرسوم
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              الدفعات
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              التقارير
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              التواصل
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-primary-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-primary-900 mb-4">الطلاب</h2>
                <p className="text-primary-700">إدارة بيانات الطلاب والدفعات</p>
              </div>
              <div className="bg-primary-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-primary-900 mb-4">الدفعات</h2>
                <p className="text-primary-700">تتبع وتحصيل الرسوم الدراسية</p>
              </div>
              <div className="bg-primary-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-primary-900 mb-4">التقارير</h2>
                <p className="text-primary-700">عرض التقارير المالية والإحصائية</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="students">
            <Students />
          </TabsContent>
          
          <TabsContent value="fees">
            <Fees />
          </TabsContent>
          
          <TabsContent value="payments">
            <Payments />
          </TabsContent>
          
          <TabsContent value="reports">
            <Reports />
          </TabsContent>
          
          <TabsContent value="communication">
            <Communication />
          </TabsContent>
          
          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SchoolDashboard; 