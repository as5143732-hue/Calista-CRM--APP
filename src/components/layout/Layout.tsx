import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileBottomNav } from './MobileBottomNav';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { Lock } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { PWAInstallButton } from './PWAInstallButton';

export const Layout: React.FC = () => {
  const { user, appUser, logout } = useAuth();

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

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16 md:pb-0">
      {/* Sidebar - Desktop fixed, Mobile hidden */}
      <div className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 md:ml-0 h-screen overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      <Toaster position="top-center" />
      <PWAInstallButton />
    </div>
  );
};
