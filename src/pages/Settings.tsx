import React from 'react';
import { User, Bell, Shield, Key, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        <div className="md:w-64 bg-slate-50 border-r border-slate-200 p-6 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
            <User className="w-4 h-4" /> Profile
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
            <Shield className="w-4 h-4" /> Security
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
            <Key className="w-4 h-4" /> Integrations
          </button>
        </div>

        <div className="flex-1 p-8">
          <div className="max-w-md">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Profile Information</h2>
            
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert('Profile updated!'); }}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  defaultValue={user?.name}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  defaultValue={user?.email}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none cursor-not-allowed" 
                />
                <p className="text-xs text-slate-500 mt-1">Contact your administrator to change your email address.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role / Job Title</label>
                <input 
                  type="text" 
                  defaultValue={user?.role}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
                <button type="submit" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
