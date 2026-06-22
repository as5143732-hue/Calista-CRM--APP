import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Users, UserPlus, CheckCircle2, CalendarDays, Rocket, Ban, Clock, Flame, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { clients } = useData();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const totalLeads = clients.length;
    const freshLeads = clients.filter(c => ['My Fresh Lead', 'New'].includes(c.status)).length;
    const interested = clients.filter(c => c.status === 'Interested').length;
    const closed = clients.filter(c => c.status === 'Done Deal').length;
    const followUps = clients.filter(c => ['Follow Up', 'Follow Up After Meeting', 'In Progress'].includes(c.status)).length;
    const meetings = clients.filter(c => c.status === 'Meeting').length;
    const lostLeads = clients.filter(c => ['Canceled', 'Not Interested', 'Unreachable'].includes(c.status)).length;
    
    const revenue = clients
      .filter(c => c.status === 'Done Deal')
      .reduce((sum, client) => sum + (Number(client.budget) || 0), 0);

    return { totalLeads, freshLeads, interested, closed, followUps, meetings, lostLeads, revenue };
  }, [clients]);

  // Derived lists for new sections
  const todaysLeads = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return clients.filter(c => new Date(c.createdAt) >= today).slice(0, 10);
  }, [clients]);

  const overdueFollowUps = useMemo(() => {
    const today = new Date();
    return clients.filter(c => c.followUpDate && new Date(c.followUpDate) < today && !['Not Interested', 'Reserved', 'Done Deal', 'Canceled', 'Unreachable'].includes(c.status)).sort((a,b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime()).slice(0, 10);
  }, [clients]);

  const hotLeads = useMemo(() => {
    return clients.filter(c => c.leadScore === 'Hot' && !['Not Interested', 'Reserved', 'Done Deal', 'Canceled', 'Unreachable'].includes(c.status)).slice(0, 10);
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

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <p className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate mr-2">{title}</p>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${colorClass || 'text-slate-300'}`} />
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{value}</h3>
      </div>
    </div>
  );

  const MiniCard = ({ client, showFollowUp = false }: any) => (
    <div 
      onClick={() => navigate(`/clients/${client.id}`)}
      className="bg-white border text-left border-slate-200 p-4 rounded-xl min-w-[240px] max-w-[240px] snap-start hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-slate-800 text-sm truncate pr-2 group-hover:text-blue-600 transition-colors">{client.name}</h4>
        {client.leadScore === 'Hot' && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Hot 🔥</span>}
        {client.leadScore === 'Warm' && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">Warm 🌤️</span>}
      </div>
      <p className="text-xs text-slate-500 mb-3 truncate">{client.phone}</p>
      
      <div className="mt-auto space-y-2">
        <div className="bg-slate-50 px-2 py-1 rounded text-xs text-slate-600 truncate font-medium">
          {client.projectName || 'General Inquiry'}
        </div>
        {showFollowUp && client.followUpDate && (
          <div className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">
            <Clock className="w-3 h-3" /> F.U: {new Date(client.followUpDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
          </div>
        )}
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard title="Fresh Leads" value={stats.freshLeads} icon={Rocket} colorClass="text-blue-500" />
        <StatCard title="Interested" value={stats.interested} icon={UserPlus} colorClass="text-emerald-500" />
        <StatCard title="Closed Deals" value={stats.closed} icon={CheckCircle2} colorClass="text-indigo-500" />
        <StatCard title="Follow Ups" value={stats.followUps} icon={Users} colorClass="text-amber-500" />
        <StatCard title="Meetings" value={stats.meetings} icon={CalendarDays} colorClass="text-purple-500" />
        <StatCard title="Lost Leads" value={stats.lostLeads} icon={Ban} colorClass="text-red-500" />
      </div>

      {todaysLeads.length > 0 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Rocket className="w-5 h-5 text-blue-500" /> Today's New Leads</h2>
            <button onClick={() => navigate('/clients')} className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">View All <ArrowRight className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory pt-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {todaysLeads.map(client => (
              <MiniCard key={client.id} client={client} />
            ))}
          </div>
        </div>
      )}

      {overdueFollowUps.length > 0 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Clock className="w-5 h-5 text-rose-500" /> Overdue Follow-ups</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory pt-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {overdueFollowUps.map(client => (
              <MiniCard key={client.id} client={client} showFollowUp={true} />
            ))}
          </div>
        </div>
      )}

      {hotLeads.length > 0 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /> Hot Alerts (Quick Action Needed)</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory pt-2 scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent">
            {hotLeads.map(client => (
              <MiniCard key={client.id} client={client} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-slate-800">Revenue Overview</h2>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} tickFormatter={(val: number) => `$${val/1000}k`} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

