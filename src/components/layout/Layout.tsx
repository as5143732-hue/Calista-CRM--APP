import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Layout: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
