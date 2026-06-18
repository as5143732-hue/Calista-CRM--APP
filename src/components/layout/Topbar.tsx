import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoUrl from '../../assets/images/regenerated_image_1778928656019.jpg';

export const Topbar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-4 w-full max-w-xs md:max-w-md">
        <div className="relative flex-1 hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search leads..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-shadow min-h-[44px]"
          />
        </div>
      </div>
      
      {/* Mobile only logo since sidebar is hidden */}
      <div className="sm:hidden flex items-center gap-2 font-bold text-slate-800 italic absolute left-1/2 -translate-x-1/2">
          <img 
            src={logoUrl} 
            alt="Calista Logo" 
            className="w-10 h-10 object-contain shrink-0"
            style={{ borderWidth: '0px', borderRadius: '21px' }}
            onError={(e) => {
              // Fallback if logo.png is not yet uploaded
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23111229'/%3E%3Ctext x='50%' y='50%' font-family='serif' font-size='40' font-weight='bold' fill='%23d4af37' text-anchor='middle' dominant-baseline='central'%3ECI%3C/text%3E%3C/svg%3E";
            }}
          />
      </div>
      
      <div className="flex items-center gap-2 md:gap-4 ml-auto sm:ml-0">
        <button className="relative p-2.5 bg-slate-100 text-slate-400 rounded-full hover:text-slate-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-8 w-px bg-slate-200 hidden md:block mx-1"></div>
        <div 
          className="flex items-center gap-2 md:gap-3 bg-slate-50 p-1 md:p-1.5 md:pl-3 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          onClick={() => navigate('/settings')}
        >
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</span>
            <span className="text-[10px] text-slate-500 leading-tight">{user?.role}</span>
          </div>
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};
