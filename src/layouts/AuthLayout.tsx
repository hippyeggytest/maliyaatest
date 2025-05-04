import  { Outlet } from 'react-router-dom';
import { Book } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen font-tajawal">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24 bg-gray-50">
        <div className="w-full max-w-md mx-auto rounded-xl shadow-lg bg-white p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-r from-primary-700 to-primary-600 shadow-lg">
              <Book className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              نظام إدارة مالية المدارس
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              تسجيل الدخول للوصول إلى لوحة التحكم
            </p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
 