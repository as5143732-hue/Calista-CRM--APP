import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, BarChart3, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

export const MobileBottomNav: React.FC = () => {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/meetings', icon: Calendar, label: 'Meetings' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#ffffff] text-[#939399] flex md:hidden items-center justify-around z-50 px-2 py-2 border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center p-2 min-w-[64px] transition-all rounded-xl",
            isActive ? "bg-[#fefefe] [&>svg]:text-[#848b8c] [&>span]:text-[#707577]" : "hover:text-slate-500"
          )}
        >
          <item.icon className="w-5 h-5 mb-1 shrink-0 transition-colors" />
          <span className="text-[10px] font-semibold transition-colors">{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
};
