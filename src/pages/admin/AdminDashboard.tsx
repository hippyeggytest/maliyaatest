import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { testConnection } from '../../lib/supabase';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<{ success: boolean; data?: any; error?: any } | null>(null);

  const runTest = async () => {
    const result = await testConnection();
    setTestResult(result);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-tajawal">
      <div className="container mx-auto py-6 px-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">لوحة تحكم المشرف</h1>
          
          <div className="mb-6">
            <button
              onClick={runTest}
              className="btn btn-primary"
            >
              اختبار الاتصال بقاعدة البيانات
            </button>
          </div>

          {testResult && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">نتائج الاختبار:</h2>
              <div className="space-y-3">
                <p>
                  مفتاح الوصول العام: 
                  <span className={testResult.success ? 'text-green-500' : 'text-red-500'}>
                    {testResult.success ? ' يعمل' : ' لا يعمل'}
                  </span>
                </p>
                <p>
                  مفتاح الوصول الخاص: 
                  <span className={testResult.success ? 'text-green-500' : 'text-red-500'}>
                    {testResult.success ? ' يعمل' : ' لا يعمل'}
                  </span>
                </p>
                {testResult.error && (
                  <p className="text-red-500">
                    خطأ: {testResult.error.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 