import  { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Edit, Image, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import db from '../../db';
import { School } from '../../types';
import { useConnection } from '../../contexts/ConnectionContext';

const Settings = () => {
  const { user } = useAuth();
  const { currentSchool, setCurrentSchool } = useApp();
  const { isOnline } = useConnection();
  const [schoolData, setSchoolData] = useState<Partial<School>>({
    name: '',
    logo: '',
    address: '',
    phone: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (currentSchool) {
      setSchoolData({
        name: currentSchool.name,
        logo: currentSchool.logo,
        address: currentSchool.address,
        phone: currentSchool.phone,
        email: currentSchool.email
      });
    }
  }, [currentSchool]);

  const handleSchoolInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSchoolData({ ...schoolData, [name]: value });
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleSchoolUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!user?.schoolId || !currentSchool) return;
      
      await db.schools.update(user.schoolId, schoolData);
      
      // Add to sync queue if online
      if (isOnline) {
        await db.syncQueue.add({
          operation: 'update',
          entity: 'school',
          entityId: user.schoolId,
          data: schoolData,
          timestamp: Date.now()
        });
      }
      
      // Update context
      setCurrentSchool({ ...currentSchool, ...schoolData });
      
      setMessage({ type: 'success', text: 'تم تحديث بيانات المدرسة بنجاح' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating school:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء تحديث بيانات المدرسة' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!user?.id) return;
      
      // Verify current password
      const currentUser = await db.users.get(user.id);
      if (!currentUser || currentUser.password !== passwordData.currentPassword) {
        setMessage({ type: 'error', text: 'كلمة المرور الحالية غير صحيحة' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      }
      
      // Verify new password matches confirmation
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMessage({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      }
      
      // Update password
      await db.users.update(user.id, { password: passwordData.newPassword });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء تغيير كلمة المرور' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">الإعدادات</h2>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <SettingsIcon className="h-5 w-5 ml-2" />
          إعدادات المدرسة
        </h3>
        <form onSubmit={handleSchoolUpdate}>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                اسم المدرسة
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={schoolData.name}
                  onChange={handleSchoolInputChange}
                  className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
                رابط شعار المدرسة
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="logo"
                  id="logo"
                  value={schoolData.logo}
                  onChange={handleSchoolInputChange}
                  className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                عنوان المدرسة
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="address"
                  id="address"
                  required
                  value={schoolData.address}
                  onChange={handleSchoolInputChange}
                  className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                رقم الهاتف
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  required
                  value={schoolData.phone}
                  onChange={handleSchoolInputChange}
                  className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                البريد الإلكتروني
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={schoolData.email}
                  onChange={handleSchoolInputChange}
                  className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Save className="h-4 w-4 ml-2" />
              حفظ التغييرات
            </button>
          </div>
        </form>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Edit className="h-5 w-5 ml-2" />
          تغيير كلمة المرور
        </h3>
        <form onSubmit={handlePasswordUpdate}>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                كلمة المرور الحالية
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="currentPassword"
                  id="currentPassword"
                  required
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                كلمة المرور الجديدة
              </label>
              <div className="mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  id="newPassword"
                  required
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                تأكيد كلمة المرور الجديدة
              </label>
              <div className="mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  id="confirmPassword"
                  required
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className="form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Save className="h-4 w-4 ml-2" />
              تغيير كلمة المرور
            </button>
          </div>
        </form>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Image className="h-5 w-5 ml-2" />
          معاينة شعار المدرسة
        </h3>
        {schoolData.logo ? (
          <div className="flex justify-center p-4 border border-gray-200 rounded-md">
            <img
              src={schoolData.logo}
              alt="شعار المدرسة"
              className="max-w-full h-auto max-h-40"
            />
          </div>
        ) : (
          <div className="flex justify-center p-8 border border-gray-200 rounded-md text-gray-400">
            لم يتم تعيين شعار للمدرسة
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
 