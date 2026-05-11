import React from 'react';
import { Search, Bell, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Topbar: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="w-96 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search leads, meetings, or deals..." 
          className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-shadow"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 bg-slate-100 text-slate-400 rounded-full hover:text-slate-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <div className="flex items-center gap-3 bg-slate-50 p-1.5 pl-3 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</span>
            <span className="text-[10px] text-slate-500 leading-tight">{user?.role}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-xs">
            {user?.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};
