import  { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, LogIn, User, Lock } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setLoginError('الرجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    
    try {
      const user = await login(username, password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/school/dashboard');
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول');
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {loginError && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mr-3">
              <p className="text-sm text-red-700">
                {loginError}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="username" className="form-label">
          اسم المستخدم
        </label>
        <div className="relative mt-1">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input pr-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-600 focus:ring-primary-600"
            placeholder="أدخل اسم المستخدم"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="form-label">
          كلمة المرور
        </label>
        <div className="relative mt-1">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input pr-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-600 focus:ring-primary-600"
            placeholder="أدخل كلمة المرور"
          />
          <button
            type="button"
            className="absolute inset-y-0 left-0 flex items-center px-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember_me"
            name="remember_me"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
          />
          <label htmlFor="remember_me" className="mr-2 block text-sm text-gray-900">
            تذكرني
          </label>
        </div>

        <div className="text-sm">
          <Link to="/auth/forgot-password" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
            نسيت كلمة المرور؟
          </Link>
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 transition-all"
        >
          <LogIn className="h-5 w-5 ml-2" />
          تسجيل الدخول
        </button>
      </div>

      <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">بيانات تجريبية للدخول:</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>مدير النظام:</strong> admin / admin123</p>
          <p><strong>مشرف المدرسة:</strong> supervisor / super123</p>
          <p><strong>مشرف الصف:</strong> grade1 / grade123</p>
        </div>
      </div>
    </form>
  );
};

export default Login;
 