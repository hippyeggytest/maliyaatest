import  { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate password reset request
    setSubmitted(true);
  };

  return (
    <div>
      {!submitted ? (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <h3 className="text-lg font-medium text-gray-900">استعادة كلمة المرور</h3>
            <p className="mt-1 text-sm text-gray-500">
              أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
            </p>
          </div>

          <div>
            <label htmlFor="email" className="form-label">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="أدخل بريدك الإلكتروني"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              إرسال رابط إعادة التعيين
            </button>
          </div>

          <div className="text-center">
            <Link to="/auth/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </form>
      ) : (
        <div className="text-center py-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">تم إرسال رابط إعادة التعيين</h3>
          <p className="mt-2 text-sm text-gray-500">
            تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني {email}. يرجى التحقق من بريدك الإلكتروني.
          </p>
          <div className="mt-6">
            <Link
              to="/auth/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
 