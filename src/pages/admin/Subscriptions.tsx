import  { useState, useEffect } from 'react';
import { School, CreditCard, Calendar, Plus, Edit, Trash, Printer, Pause, Play, Lock } from 'lucide-react';
import db from '../../db';
import { School as SchoolType } from '../../types';
import { formatGeorgianDate } from '../../utils/dateFormatters';

const Subscriptions = () => {
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    schoolId: '',
    amount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    const allSchools = await db.schools.toArray();
    setSchools(allSchools);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const schoolId = parseInt(formData.schoolId);
      
      // Update school subscription dates
      await db.schools.update(schoolId, {
        subscriptionStart: new Date(formData.startDate).toISOString(),
        subscriptionEnd: new Date(formData.endDate).toISOString(),
        status: 'active'
      });
      
      // In a real app, you would save the subscription payment details to a database
      
      setShowForm(false);
      setFormData({
        schoolId: '',
        amount: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: 'cash',
        notes: ''
      });
      
      fetchSchools();
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const handleRenew = (schoolId: number | undefined) => {
    if (!schoolId) return;
    
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      setFormData({
        schoolId: String(schoolId),
        amount: '5000', // Example subscription amount
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: 'cash',
        notes: `تجديد اشتراك ${school.name}`
      });
      setShowForm(true);
    }
  };

  const handleEdit = (schoolId: number | undefined) => {
    if (!schoolId) return;
    
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      setFormData({
        schoolId: String(schoolId),
        amount: '5000', // Example subscription amount
        startDate: new Date(school.subscriptionStart).toISOString().split('T')[0],
        endDate: new Date(school.subscriptionEnd).toISOString().split('T')[0],
        paymentMethod: 'cash',
        notes: `تعديل اشتراك ${school.name}`
      });
      setShowForm(true);
    }
  };

  const handleToggleStatus = async (schoolId: number | undefined, currentStatus: string) => {
    if (!schoolId) return;
    
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await db.schools.update(schoolId, { status: newStatus });
      fetchSchools();
    } catch (error) {
      console.error('Error toggling school status:', error);
    }
  };

  const handleResetPassword = async (schoolId: number | undefined) => {
    if (!schoolId) return;
    
    try {
      // Get all users for this school
      const schoolUsers = await db.users.where('schoolId').equals(schoolId).toArray();
      
      if (confirm(`هل أنت متأكد من إعادة تعيين كلمات المرور لجميع مستخدمي هذه المدرسة؟`)) {
        // Reset password for all users
        for (const user of schoolUsers) {
          await db.users.update(user.id!, {
            password: 'password123' // In a real app, this would be a secure password
          });
        }
        alert(`تم إعادة تعيين كلمات المرور لـ ${schoolUsers.length} مستخدم`);
      }
    } catch (error) {
      console.error('Error resetting passwords:', error);
    }
  };

  const handlePrintSubscription = (school: SchoolType) => {
    // In a real app, this would open a printable receipt or certificate
    alert(`طباعة بيانات اشتراك ${school.name}`);
  };

  return (
    <div>
      <div className="relative rounded-lg overflow-hidden mb-8 h-40">
        <img 
          src="https://images.unsplash.com/photo-1494475673543-6a6a27143fc8?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw2fHxtb2Rlcm4lMjBzY2hvb2wlMjBidWlsZGluZyUyMG1pZGRsZSUyMGVhc3QlMjBhcmFiaWMlMjBlZHVjYXRpb258ZW58MHx8fHwxNzQ2MDIyMzY0fDA&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800" 
          alt="إدارة الاشتراكات" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-800/90 to-primary-600/50 flex items-center px-6">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-2">إدارة الاشتراكات</h2>
            <p className="text-white/80">
              إدارة اشتراكات المدارس وتجديدها
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-semibold">إدارة الاشتراكات</h2>
        <button
          onClick={() => {
            setFormData({
              schoolId: '',
              amount: '',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              paymentMethod: 'cash',
              notes: ''
            });
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-5 w-5 ml-2" />
          تسجيل اشتراك جديد
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {formData.schoolId ? 'تحديث اشتراك' : 'تسجيل اشتراك جديد'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700">
                  المدرسة
                </label>
                <div className="mt-1">
                  <select
                    id="schoolId"
                    name="schoolId"
                    required
                    value={formData.schoolId}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">اختر المدرسة</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  المبلغ
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="amount"
                    id="amount"
                    required
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  تاريخ بداية الاشتراك
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  تاريخ نهاية الاشتراك
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="endDate"
                    id="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                  طريقة الدفع
                </label>
                <div className="mt-1">
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    required
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="cash">نقدي</option>
                    <option value="bank">تحويل بنكي</option>
                    <option value="card">بطاقة ائتمان</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  ملاحظات
                </label>
                <div className="mt-1">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3 gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {formData.schoolId ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المدرسة
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                بداية الاشتراك
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                نهاية الاشتراك
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schools.length > 0 ? (
              schools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full">
                        {school.logo ? (
                          <img className="h-10 w-10 rounded-full" src={school.logo} alt={school.name} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <School className="h-6 w-6 text-primary-600" />
                          </div>
                        )}
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">{school.name}</div>
                        <div className="text-sm text-gray-500">{school.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatGeorgianDate(school.subscriptionStart)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatGeorgianDate(school.subscriptionEnd)}</div>
                    {new Date(school.subscriptionEnd) < new Date() && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        منتهي
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      school.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : school.status === 'inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {school.status === 'active'
                        ? 'نشط'
                        : school.status === 'inactive'
                        ? 'غير نشط'
                        : 'قيد المعالجة'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2 gap-2">
                      <button
                        onClick={() => handleEdit(school.id)}
                        className="text-primary-600 hover:text-primary-900"
                        title="تعديل الاشتراك"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleRenew(school.id)}
                        className="text-green-600 hover:text-green-900"
                        title="تجديد الاشتراك"
                      >
                        <Calendar className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handlePrintSubscription(school)}
                        className="text-blue-600 hover:text-blue-900"
                        title="طباعة"
                      >
                        <Printer className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(school.id, school.status)}
                        className={school.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                        title={school.status === 'active' ? 'تعطيل' : 'تفعيل'}
                      >
                        {school.status === 'active' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleResetPassword(school.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="إعادة تعيين كلمات المرور"
                      >
                        <Lock className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  لا توجد مدارس مسجلة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Subscriptions;
 