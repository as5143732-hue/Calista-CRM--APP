import React from 'react';
import { useData } from '../context/DataContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { formatCurrency } from '../lib/utils';
import { Target, Users2, Building, ArrowUpRight } from 'lucide-react';

export const Reports: React.FC = () => {
  const { clients } = useData();

  // Data processing for charts
  const statusCounts = clients.reduce((acc, client) => {
    acc[client.status] = (acc[client.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.keys(statusCounts).map(key => ({
    name: key,
    value: statusCounts[key]
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#64748b'];

  const totalRevenue = clients
    .filter(c => c.status === 'Done Deal')
    .reduce((sum, c) => sum + (Number(c.budget) || 0), 0);

  const pipelineValue = clients
    .filter(c => ['Interested', 'Meeting', 'Pending', 'Follow Up', 'Reserved'].includes(c.status))
    .reduce((sum, c) => sum + (Number(c.budget) || 0), 0);

  const conversionRate = clients.length > 0 
    ? (clients.filter(c => c.status === 'Done Deal').length / clients.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Deep dive into your CRM performance and sales pipeline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm hover:border-blue-200 transition-colors">
           <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">
             <Target className="w-4 h-4 text-blue-500" />
             Conversion Rate
           </div>
           <div className="text-4xl font-bold text-slate-900">{conversionRate.toFixed(1)}%</div>
           <div className="mt-2 text-xs flex items-center">
             <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 mr-1" />
             <span className="text-emerald-500 font-bold uppercase">+2.4%</span>
           </div>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm hover:border-blue-200 transition-colors">
           <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">
             <Users2 className="w-4 h-4 text-purple-500" />
             Pipeline Value
           </div>
           <div className="text-4xl font-bold text-slate-900">{formatCurrency(pipelineValue)}</div>
           <div className="mt-2 text-xs text-slate-500 font-medium">
             Potential revenue from active leads
           </div>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm hover:border-blue-200 transition-colors">
           <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">
             <Building className="w-4 h-4 text-emerald-500" />
             Closed Revenue
           </div>
           <div className="text-4xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</div>
           <div className="mt-2 text-xs text-slate-500 font-medium">
             Total revenue from won deals
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-6">Leads by Status</h2>
          <div className="h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
             {statusData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                  No data available
                </div>
              )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-6">Top Deals</h2>
          <div className="space-y-2">
            {clients
              .filter(c => c.status === 'Done Deal' || c.status === 'Reserved')
              .sort((a, b) => (Number(b.budget) || 0) - (Number(a.budget) || 0))
              .slice(0, 6)
              .map(client => (
              <div key={client.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{client.name}</div>
                    <div className="text-xs text-slate-400">{client.projectName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-slate-900">{formatCurrency(client.budget)}</div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">{client.status}</div>
                </div>
              </div>
            ))}
            {clients.filter(c => c.status === 'Done Deal' || c.status === 'Reserved').length === 0 && (
               <div className="text-center text-slate-500 py-8">
                No high-value deals found yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
