import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, BarChart3, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { logout } = useAuth();
  
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/meetings', icon: Calendar, label: 'Meetings' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-[#0f172a] text-white h-full flex flex-col">
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0" style={{ backgroundColor: '#111229' }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
            style={{
              backgroundColor: '#00C3D0',
              borderColor: '#160c0c',
              textAlign: 'center',
              fontStyle: 'italic',
              fontFamily: 'Verdana',
              lineHeight: '25px',
              fontSize: '19px',
              color: '#312323'
            }}
          >
            <span style={{ color: '#100f0f', fontWeight: 'bold' }}>C</span>
          </div>
          <span 
            className="text-xl tracking-tight text-white truncate"
            style={{
              fontFamily: 'Georgia',
              fontWeight: 'bold',
              fontStyle: 'italic',
              textAlign: 'left'
            }}
          >Calista CRM</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 hover:bg-slate-800 rounded-md">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1" style={{ backgroundColor: '#00b1bd' }}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-4 px-2" style={{ color: '#f0f2f5', fontSize: '15px' }}>
          Menu
        </div>
        {navItems.map((item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]",
              isActive 
                ? "bg-blue-600/20 text-blue-400" 
                : "hover:bg-slate-800"
            )}
            style={{
              color: index === 0 ? '#f2f2f2' : index === 1 ? '#f0f4f8' : index === 2 ? '#f1eeee' : index === 3 ? '#f0ebeb' : index === 4 ? '#f0f2f5' : undefined,
              fontWeight: index === 0 ? 'bold' : undefined,
              borderColor: '#000000',
              borderWidth: '0.740741px',
              backgroundColor: index === 0 ? '#00C3D0' : undefined
            }}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800 shrink-0" style={{}}>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors min-h-[44px]"
          style={{ color: '#eff4f4' }}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="truncate">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
