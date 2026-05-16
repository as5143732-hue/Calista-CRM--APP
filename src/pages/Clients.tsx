import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Phone, MessageCircle, Calendar as CalendarIcon, Bell, CalendarPlus, User, Building2, Globe, Clock, PhoneCall, Trash2 } from 'lucide-react';
import { StatusBadge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { ClientForm } from '../components/forms/ClientForm';
import { Client, ClientStatus, Activity } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const ALL_STATUSES: ClientStatus[] = [
  'New', 'In Progress', 'Interested', 'Reserved', 'Not Interested',
  'My Fresh Lead', 'Follow Up', 'Meeting', 'Pending', 
  'Done Deal', 'No Answer', 'No Answer At All', 'Follow Up After Meeting', 
  'Canceled', 'Low Budget', 'Unreachable', 'Call Attempt'
];

const FILTER_STATUSES: string[] = [
  'Interested', 'Reserved', 'Not Interested',
  'Fresh Lead', 'Follow Up', 'Meeting', 'Pending', 
  'Done Deal', 'No Answer', 'No Answer At All', 'Follow Up After Meeting', 
  'Canceled', 'Low Budget', 'Unreachable'
];

const ClientCard: React.FC<{ client: Client, logQuickAction: any, user: any, deleteClient: any }> = ({ client, logQuickAction, user, deleteClient }) => {
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState<Activity | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, `clients/${client.id}/activities`), 
      orderBy('createdAt', 'desc'), 
      limit(1)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
         setLastActivity({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Activity);
      } else {
         setLastActivity(null);
      }
    }, (error) => {
       console.error("Failed to fetch last activity", error);
    });

    return () => unsubscribe();
  }, [client.id]);

  const handleWhatsApp = (e: React.MouseEvent, phone: string, clientId: string) => {
    e.stopPropagation();
    logQuickAction(clientId, 'whatsapp_sent');
    window.open(`https://wa.me/2${phone.replace(/[^0-9]/g, '')}`, '_blank');
  };

  const handleSetReminder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
      return;
    }

    if (Notification.permission === 'granted') {
      scheduleNotification();
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        scheduleNotification();
      }
    }
  };

  const scheduleNotification = () => {
    // For demo purposes: Set a fake reminder for 1 minute from now
    alert('تم تعيين مؤقت تذكير لهذا العميل بعد دقيقة واحدة (للتجربة).');
    setTimeout(() => {
      new Notification(`تذكير بمتابعة العميل: ${client.name}`, {
        body: `يرجى متابعة العميل ${client.name} الآن.`,
        icon: '/favicon.ico'
      });
    }, 60000);
  };

  const formatActivityName = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div 
      onClick={() => navigate(`/clients/${client.id}`)}
      className="bg-[#244648] rounded-[24px] p-4 sm:p-5 shadow-xl hover:-translate-y-1 transition-transform cursor-pointer relative w-full flex flex-col sm:h-[250px] overflow-hidden"
    >
        <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[170px_1fr] gap-3 sm:gap-4 h-full">
            
            {/* Left Column */}
            <div className="flex flex-col justify-between h-full sm:w-[170px] w-full">
                {/* Name */}
                <div className="bg-white rounded-xl px-2 py-2 flex items-center gap-2 mb-2 sm:mb-0">
                    <div className="bg-[#6db5a4] rounded-full p-1.5 shrink-0 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-slate-800 text-xs truncate" title={client.name}>{client.name}</span>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                    <div className="bg-white rounded-xl px-2 py-2 flex items-center gap-2 flex-1 min-w-0">
                        <PhoneCall className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-bold text-slate-800 text-xs truncate">{client.phone}</span>
                    </div>
                    <button 
                        onClick={(e) => handleWhatsApp(e, client.phone, client.id)}
                        className="text-[#4bcd62] hover:text-green-400 transition-colors shrink-0 outline-none p-1"
                        style={{ background: 'transparent' }}
                    >
                        <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Project */}
                <div className="bg-white rounded-xl px-2 py-2 flex items-center gap-2 sm:mb-2 mt-auto">
                    <Building2 className="w-4 h-4 text-amber-900 shrink-0" />
                    <span className="font-bold text-slate-800 text-xs truncate">{client.projectName || 'No Project'}</span>
                </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col justify-between h-full sm:pl-2 min-w-0">
                {/* Top Row: Status & User */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 relative">
                    <div className="bg-white rounded-full px-3 sm:px-4 py-1.5 font-bold text-slate-800 text-xs text-center w-full sm:flex-1 truncate">
                        {client.status}
                    </div>
                    {user?.role === 'admin' ? (
                        <div className="bg-white rounded-full px-3 sm:px-4 py-1.5 font-bold text-slate-800 text-xs text-center w-full sm:flex-1 truncate relative pr-8" title={client.salesAgent}>
                            {client.salesAgent?.split(' ')[0] || 'Unknown'}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm("هل أنت متأكد من حذف بيانات هذا العميل؟")) {
                                        deleteClient(client.id);
                                    }
                                }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                         <div className="bg-white rounded-full px-3 sm:px-4 py-1.5 font-bold text-slate-800 text-xs text-center w-full sm:flex-1 truncate" title={user?.name}>
                            {user?.name?.split(' ')[0] || 'Unknown'}
                        </div>
                    )}
                </div>

                {/* Middle Box: Last Action */}
                <div className="bg-white rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center min-h-[70px] sm:min-h-[90px] w-full text-center my-2 shadow-sm flex-1">
                    <span className="font-bold text-slate-800 text-sm mb-1">
                        {lastActivity ? formatActivityName(lastActivity.type) : 'No Actions Yet'}
                    </span>
                    {lastActivity?.content && (
                        <span className="text-xs font-medium text-slate-500 line-clamp-2 leading-tight">
                            {lastActivity.content}
                        </span>
                    )}
                </div>

                {/* Bottom Row: Sources & Last Date */}
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:mb-2">
                    <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 w-full sm:flex-1 overflow-hidden">
                        <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="font-bold text-slate-800 text-xs truncate" title={client.leadSource || 'Direct'}>{client.leadSource || 'Direct'}</span>
                    </div>
                    <div className="bg-white rounded-xl px-2 sm:px-3 py-2 flex items-center justify-center gap-1.5 w-full sm:w-[125px]">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-bold text-slate-800 text-[10px] truncate">
                           {lastActivity ? formatDistanceToNow(new Date(lastActivity.createdAt), { addSuffix: true }) : '---'}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export const Clients: React.FC = () => {
  const { clients, addClient, updateClient, logQuickAction, deleteClient } = useData();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

  // Extract unique projects for the filter dropdown
  const uniqueProjects = Array.from(new Set(clients.map(c => c.projectName).filter(Boolean)));

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.phone || '').includes(searchTerm);
    
    // Handle 'Fresh Lead' map to 'My Fresh Lead'
    const matchTargetStatus = statusFilter === 'Fresh Lead' ? 'My Fresh Lead' : statusFilter;
    const matchesStatus = statusFilter ? c.status === matchTargetStatus : true;
    const matchesProject = projectFilter ? c.projectName === projectFilter : true;

    return matchesSearch && matchesStatus && matchesProject;
  }).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleAddOrEdit = (data: any) => {
    if (editingClient) {
      updateClient(editingClient.id, data);
    } else {
      addClient(data);
    }
    setIsModalOpen(false);
    setEditingClient(undefined);
  };

  const openAdd = () => {
    setEditingClient(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Top Header & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
            <p className="text-slate-500 text-sm mt-1">Manage all your contacts list.</p>
          </div>
          
          <button 
            onClick={openAdd}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add Client
          </button>
        </div>

        {/* Filters Row */}
        <div className="bg-[#bcc1ca] border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-row items-center gap-3 sm:gap-4 overflow-x-auto snap-x">
           <div className="flex items-center gap-2 font-bold text-slate-800 shrink-0 snap-start">
             <Filter className="w-5 h-5 text-blue-500" /> <span className="hidden sm:inline">Filters:</span>
           </div>
           
           <div className="relative w-48 sm:w-64 shrink-0 snap-start">
             <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
             <input 
               type="text" 
               placeholder="Search clients..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow"
             />
           </div>

           <div className="w-40 sm:w-48 shrink-0 snap-start">
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium text-slate-800"
             >
               <option value="">All Statuses</option>
               {FILTER_STATUSES.map(status => (
                 <option key={status} value={status}>{status}</option>
               ))}
             </select>
           </div>

           <div className="w-40 sm:w-48 shrink-0 snap-start">
             <select 
               value={projectFilter}
               onChange={(e) => setProjectFilter(e.target.value)}
               className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium text-slate-800"
             >
               <option value="">All Projects</option>
               {uniqueProjects.map(proj => (
                 <option key={proj} value={proj || ''}>{proj}</option>
               ))}
             </select>
           </div>
        </div>
      </div>

      {/* Main Content: Vertical Client List */}
      <div className="flex-1 bg-[#bcc1ca] rounded-3xl border border-slate-200 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6 max-w-4xl mx-auto">
           <h2 className="font-bold text-slate-800">
             Showing {filteredClients.length} {filteredClients.length === 1 ? 'Client' : 'Clients'}
           </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 xl:gap-6 max-w-[1600px] mx-auto pb-10">
          {filteredClients.map((client) => (
             <ClientCard key={client.id} client={client} logQuickAction={logQuickAction} user={user} deleteClient={deleteClient} />
          ))}
          {filteredClients.length === 0 && (
            <div className="py-20 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl bg-white col-span-full">
               There are no clients matching your filters.
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
