import  { useState, useEffect } from 'react';
import { User, Users, CreditCard, School } from 'lucide-react';
import db from '../../db';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    schools: 0,
    activeSchools: 0,
    users: 0,
    payments: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const schools = await db.schools.count();
      const activeSchools = await db.schools.where('status').equals('active').count();
      const users = await db.users.count();
      const payments = await db.payments.count();

      setStats({
        schools,
        activeSchools,
        users,
        payments
      });
    };

    fetchStats();
  }, []);

  const stats_cards = [
    { name: 'إجمالي المدارس', value: stats.schools, icon: School, color: 'bg-primary-700' },
    { name: 'المدارس النشطة', value: stats.activeSchools, icon: School, color: 'bg-green-600' },
    { name: 'المستخدمين', value: stats.users, icon: Users, color: 'bg-blue-500' },
    { name: 'المدفوعات', value: stats.payments, icon: CreditCard, color: 'bg-yellow-500' }
  ];

  return (
    <div>
      <div className="relative rounded-lg overflow-hidden mb-8 h-56">
        <img 
          src="https://images.unsplash.com/photo-1494475673543-6a6a27143fc8?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw2fHxtb2Rlcm4lMjBzY2hvb2wlMjBidWlsZGluZyUyMG1pZGRsZSUyMGVhc3QlMjBhcmFiaWMlMjBlZHVjYXRpb258ZW58MHx8fHwxNzQ2MDIyMzY0fDA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800" 
          alt="مبنى مدرسة حديث" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-700/90 to-primary-600/50 flex items-center px-6">
          <div className="text-white">
            <h1 className="text-2xl font-bold mb-2">مركز التحكم الإداري</h1>
            <p className="text-white/80 max-w-xl">
              إدارة المدارس والمستخدمين والاشتراكات بشكل متكامل وسهل
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">إحصائيات النظام</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats_cards.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="mr-5">
                    <p className="text-sm font-medium text-gray-500 truncate">{stat.name}</p>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-700 hover:text-primary-800">
                    عرض التفاصيل
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">آخر الأنشطة</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            <li>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary-700 truncate">تم تسجيل مدرسة جديدة</p>
                  <div className="mr-5 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      قيد المعالجة
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <User className="flex-shrink-0 ml-1.5 h-5 w-5 text-gray-400" />
                      مدرسة النور الدولية
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      منذ دقائق
                    </p>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary-700 truncate">تجديد اشتراك</p>
                  <div className="mr-5 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      تم التجديد
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <User className="flex-shrink-0 ml-1.5 h-5 w-5 text-gray-400" />
                      مدرسة الأمل
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      منذ ساعة
                    </p>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary-700 truncate">إضافة مستخدم جديد</p>
                  <div className="mr-5 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      تم الإضافة
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <User className="flex-shrink-0 ml-1.5 h-5 w-5 text-gray-400" />
                      محمد أحمد - مشرف
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      منذ 3 ساعات
                    </p>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
 