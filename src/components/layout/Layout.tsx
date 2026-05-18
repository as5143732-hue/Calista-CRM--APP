import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { Lock } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, appUser, isAppPasswordVerified, verifyAppPassword, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      const loginTime = localStorage.getItem('login_time');
      const now = Date.now();
      
      // If no login_time or if 24 hours have passed
      if (!loginTime || now - parseInt(loginTime, 10) >= 86400000) {
        localStorage.clear();
        localStorage.setItem('session_expired_message', 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً');
        logout();
      }
    }
  }, [user, logout]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin approval pending state
  if (appUser && !appUser.isActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">حسابك قيد المراجعة</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            حسابك قيد المراجعة من قبل المسؤول. يرجى الانتظار حتى يتم تفعيله.
          </p>
          <button 
            onClick={logout}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  // App Password prompt state
  if (appUser && appUser.isActive && !isAppPasswordVerified) {
    const handleVerify = (e: React.FormEvent) => {
      e.preventDefault();
      if (verifyAppPassword(passwordInput)) {
        setPasswordError('');
      } else {
        setPasswordError('كلمة المرور غير صحيحة');
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">تسجيل الدخول للتطبيق</h2>
          <p className="text-slate-600 mb-6 text-sm">
            الرجاء إدخال كلمة مرور التطبيق الخاصة بك للمتابعة.
          </p>
          
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="كلمة مرور التطبيق"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-center text-lg"
              />
              {passwordError && <p className="text-red-500 text-sm mt-2 font-medium">{passwordError}</p>}
            </div>
            
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-colors text-lg"
            >
              دخول
            </button>
          </form>

          <button 
            onClick={logout}
            className="text-slate-500 hover:text-slate-600 text-sm mt-6 font-medium"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar - Desktop fixed, Mobile drawer */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 md:ml-0 h-screen overflow-hidden">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
