import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, BarChart3, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import logoUrl from '../../assets/images/regenerated_image_1778928656019.jpg';

export const Sidebar: React.FC = () => {
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
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0" style={{ backgroundColor: '#e2ece5', color: '#0a0a0a' }}>
        <div className="flex items-center gap-3">
          <img 
            src={logoUrl} 
            alt="Calista Logo" 
            className="w-10 h-10 object-contain shrink-0"
            onError={(e) => {
              // Fallback if logo.png is not yet uploaded
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23111229'/%3E%3Ctext x='50%' y='50%' font-family='serif' font-size='40' font-weight='bold' fill='%23d4af37' text-anchor='middle' dominant-baseline='central'%3ECI%3C/text%3E%3C/svg%3E";
            }}
          />
          <span 
            className="text-xl tracking-tight truncate"
            style={{
              fontFamily: 'Georgia',
              fontWeight: 'bold',
              fontStyle: 'italic',
              textAlign: 'left',
              color: '#040404'
            }}
          >Calista CRM</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1" style={{ backgroundColor: '#00b1bd' }}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-4 px-2" style={{ color: '#f0f2f5', fontSize: '15px' }}>
          Menu
        </div>
        {navItems.map((item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
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

      <div className="p-4 border-t border-slate-800 shrink-0" style={{ backgroundColor: '#e2ece5' }}>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-colors min-h-[44px] hover:opacity-90"
          style={{ 
            backgroundColor: '#ccd3d3',
            color: '#000000',
            fontWeight: 'bold',
            fontSize: '15px',
            lineHeight: '20px'
          }}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="truncate">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
