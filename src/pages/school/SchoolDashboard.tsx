import { useAuth } from '../../contexts/AuthContext';

const SchoolDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 font-tajawal">
      <div className="container mx-auto py-6 px-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">لوحة تحكم المدرسة</h1>
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
        </div>
      </div>
    </div>
  );
};

export default SchoolDashboard; 