import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { fetchSignInMethodsForEmail } from 'firebase/auth';

export const Login: React.FC = () => {
  const { login, loginWithEmail, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const msg = localStorage.getItem('session_expired_message');
    if (msg) {
      setError(msg);
      localStorage.removeItem('session_expired_message');
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async () => {
    try {
      setIsLoggingIn(true);
      setError('');
      await login();
      // Wait for useEffect to navigate
    } catch (err) {
      setError('فشل تسجيل الدخول باستخدام جوجل');
      console.error(err);
      setIsLoggingIn(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    const safeEmail = email.trim().toLowerCase();
    try {
      setIsLoggingIn(true);
      setError('');

      // Check if user exists in Auth and has only Google provider
      let isGoogleOnly = false;
      try {
        const methods = await fetchSignInMethodsForEmail(auth, safeEmail);
        if (methods.includes('google.com') && !methods.includes('password')) {
          isGoogleOnly = true;
        }
      } catch (authErr) {
        console.warn('fetchSignInMethodsForEmail failed:', authErr);
      }

      if (isGoogleOnly) {
        setError('هذا الحساب مسجل عبر Google فقط. يرجى تسجيل الدخول باستخدام Google أولاً، ثم الانتقال للإعدادات لتعيين كلمة مرور للحساب لربطه.');
        setIsLoggingIn(false);
        return;
      }

      await loginWithEmail(safeEmail, password);
    } catch (err: any) {
      if (err && (err.code === 'auth/operation-not-allowed' || String(err).includes('operation-not-allowed'))) {
        setError('خطأ: ميزة الدخول بالبريد الإلكتروني غير مفعلة في مشروع Firebase الخاص بك. يرجى الانتقال إلى Firebase Console وتفعيل خيار "Email/Password" من قائمة "Sign-in method" في قسم Authentication.');
      } else if (err && (err.code === 'auth/invalid-credential' || String(err).includes('invalid-credential') || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found')) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى بالتأكد من البيانات والمحاولة مجدداً.');
      } else {
        setError('فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.');
      }
      if (err && (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found')) {
        console.warn('Authentication err processed:', err.code);
      } else {
        console.error(err);
      }
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white">
          <span className="text-xl">C</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Calista CRM
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sign in to access your dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100 flex flex-col items-center">
          
          {error && <div className="mb-4 text-red-500 text-sm font-medium text-center w-full">{error}</div>}

          <form onSubmit={handleEmailSignIn} className="w-full space-y-4 mb-5" dir="rtl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
              <input 
                type="email" 
                required
                disabled={isLoggingIn}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@calista.com"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-right transition-all text-sm" 
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
              <input 
                type="password" 
                required
                disabled={isLoggingIn}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-right transition-all text-sm" 
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex justify-center items-center py-2.5 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none transition-all disabled:opacity-50"
            >
              {isLoggingIn ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="relative w-full flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-3 text-xs text-slate-400 font-medium">أو</span>
          </div>

          <button
            onClick={handleSignIn}
            disabled={isLoggingIn}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 bg-white text-slate-700 border border-slate-300 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
          
        </div>
      </div>
    </div>
  );
};
