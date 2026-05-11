import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Users, UserPlus, CheckCircle2, CalendarDays, Rocket, PhoneOutcome, Ban } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const { clients } = useData();

  const stats = useMemo(() => {
    const totalLeads = clients.length;
    const freshLeads = clients.filter(c => c.status === 'My Fresh Lead').length;
    const interested = clients.filter(c => c.status === 'Interested').length;
    const closed = clients.filter(c => c.status === 'Done Deal').length;
    const followUps = clients.filter(c => c.status === 'Follow Up' || c.status === 'Follow Up After Meeting').length;
    const meetings = clients.filter(c => c.status === 'Meeting').length;
    const lostLeads = clients.filter(c => ['Canceled', 'Not Interested', 'Unreachable'].includes(c.status)).length;
    
    const revenue = clients
      .filter(c => c.status === 'Done Deal')
      .reduce((sum, client) => sum + (Number(client.budget) || 0), 0);

    return { totalLeads, freshLeads, interested, closed, followUps, meetings, lostLeads, revenue };
  }, [clients]);

  // Dummy chart data
  const chartData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 5000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 8890 },
    { name: 'Jun', revenue: 2390 },
    { name: 'Jul', revenue: stats.revenue > 0 ? stats.revenue : 3490 },
  ];

  const StatCard = ({ title, value, icon: Icon, trend, trendUp, colorClass }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <Icon className={`w-4 h-4 ${colorClass || 'text-slate-300'}`} />
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of your CRM metrics and recent activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard title="Fresh Leads" value={stats.freshLeads} icon={Rocket} colorClass="text-blue-500" />
        <StatCard title="Interested" value={stats.interested} icon={UserPlus} colorClass="text-emerald-500" />
        <StatCard title="Closed Deals" value={stats.closed} icon={CheckCircle2} colorClass="text-indigo-500" />
        <StatCard title="Follow Ups" value={stats.followUps} icon={Users} colorClass="text-amber-500" />
        <StatCard title="Meetings" value={stats.meetings} icon={CalendarDays} colorClass="text-purple-500" />
        <StatCard title="Lost Leads" value={stats.lostLeads} icon={Ban} colorClass="text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-slate-800">Revenue Overview</h2>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h2 className="font-bold text-slate-800 mb-4">Recent Deal Activity</h2>
          <div className="flex-1 overflow-auto">
            <div className="space-y-4">
              {clients.slice(0, 5).map(client => (
                <div key={client.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{client.name}</p>
                    <p className="text-xs text-slate-400 truncate">{client.projectName} • <span className="uppercase">{client.status}</span></p>
                  </div>
                  <div className="ml-auto font-mono text-sm text-slate-900">
                    {formatCurrency(client.budget)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

