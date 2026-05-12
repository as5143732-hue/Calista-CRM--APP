import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import { StatusBadge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { ClientForm } from '../components/forms/ClientForm';
import { Client, ClientStatus } from '../types';
import { format } from 'date-fns';

const ALL_STATUSES: ClientStatus[] = [
  'My Fresh Lead', 'Follow Up', 'Meeting', 'Pending', 'Reserved', 
  'Done Deal', 'No Answer', 'No Answer At All', 'Follow Up After Meeting', 
  'Canceled', 'Interested', 'Low Budget', 'Not Interested', 'Unreachable'
];

export const Clients: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.projectName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddOrEdit = (data: any) => {
    if (editingClient) {
      updateClient(editingClient.id, data);
    } else {
      addClient(data);
    }
    setIsModalOpen(false);
    setEditingClient(undefined);
  };

  const openEdit = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm('Are you sure you want to delete this client?')) {
      deleteClient(id);
    }
  };

  const openAdd = () => {
    setEditingClient(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your leads and clients here.</p>
        </div>
        <button 
          onClick={openAdd}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Client
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 className="font-bold text-slate-800">All Clients</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow appearance-none font-medium text-slate-700"
              >
                <option value="All">All Statuses</option>
                {ALL_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search clients..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow"
              />
            </div>
          </div>
        </div>
        
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Project</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Budget</th>
                <th className="px-6 py-3">Next Follow Up</th>
                {user?.role === 'admin' && <th className="px-6 py-3">Owner</th>}
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr 
                    key={client.id} 
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{client.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{client.email || client.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{client.projectName || '-'}</td>
                    <td className="px-6 py-4"><StatusBadge status={client.status} /></td>
                    <td className="px-6 py-4 font-mono text-sm font-medium">{formatCurrency(client.budget)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {client.followUpDate ? format(new Date(client.followUpDate), 'MMM d, yyyy') : '-'}
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {client.salesAgent || 'Unknown'}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => openEdit(e, client)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white border text-transparent border-transparent hover:border-slate-200 hover:shadow-sm rounded-md transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, client.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white border text-transparent border-transparent hover:border-slate-200 hover:shadow-sm rounded-md transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <p className="text-base font-medium text-slate-700 mb-1">No clients found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <div 
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="p-4 active:bg-slate-50 transition-colors flex flex-col gap-3 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">{client.name}</h3>
                    <p className="text-sm text-slate-500">{client.email || client.phone}</p>
                  </div>
                  <StatusBadge status={client.status} />
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">Project</span>
                    <span className="font-medium">{client.projectName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Budget</span>
                    <span className="font-mono font-medium">{formatCurrency(client.budget)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Follow Up</span>
                    <span className="text-slate-700">
                      {client.followUpDate ? format(new Date(client.followUpDate), 'MMM d, yyyy') : '-'}
                    </span>
                  </div>
                  {user?.role === 'admin' && (
                    <div>
                      <span className="text-slate-400 block text-xs">Owner</span>
                      <span className="text-slate-700">{client.salesAgent || 'Unknown'}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4 pt-2 border-t border-slate-50 mt-1">
                  <button 
                    onClick={(e) => openEdit(e, client)}
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, client.id)}
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-12 text-center text-slate-500">
              <p className="text-base font-medium text-slate-700 mb-1">No clients found</p>
              <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingClient ? 'Edit Client' : 'Add New Client'}
      >
        <ClientForm 
          initialData={editingClient} 
          onSubmit={handleAddOrEdit} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

