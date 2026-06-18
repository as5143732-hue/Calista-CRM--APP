import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Phone, MessageCircle, Calendar as CalendarIcon, Bell, CalendarPlus, User, Building2, Globe, Clock, PhoneCall, Trash2, ChevronDown, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
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

const ClientCard: React.FC<{ client: Client, logQuickAction: any, user: any, deleteClient: any, usersMap: any, onOpenFollowUp: (c: Client) => void }> = ({ client, logQuickAction, user, deleteClient, usersMap, onOpenFollowUp }) => {
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState<Activity | null>(null);
  const [isActionOpen, setIsActionOpen] = useState(false);

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

  const handleWhatsApp = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2);
    }
    
    if (cleaned.startsWith('01') && cleaned.length === 11) {
      cleaned = '2' + cleaned;
    }
    
    window.open(`https://wa.me/${cleaned}`, '_blank');
  };

  const formatActivityName = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div 
      onClick={() => navigate(`/clients/${client.id}`)}
      className="bg-[#6d898d] rounded-3xl p-4 sm:p-5 shadow-xl hover:-translate-y-1 transition-transform cursor-pointer relative w-full"
      style={{ marginTop: '0px', marginBottom: '25px' }}
    >
        {/* Action Button */}
        <div className="absolute top-4 sm:top-5 right-4 sm:right-5 z-20">
            <button
                onClick={(e) => { e.stopPropagation(); onOpenFollowUp(client); }}
                className="bg-[#4a6366] hover:bg-[#3d5154] text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors shadow-md outline-none border border-white/20"
            >
                Action
            </button>
        </div>

        {/* Desktop Grid Layout (Hidden on Mobile) */}
        <div className="hidden lg:grid grid-cols-[180px_1fr_1fr_150px] gap-x-4 gap-y-4">
            
            {/* ROW 1 */}
            {/* Name */}
            <div className="bg-white px-3 py-2 flex items-center gap-2 rounded-full" style={{ width: '300px', borderRadius: '40px', backgroundColor: '#6d898d' }}>
                <div className="bg-[#6db5a4] rounded-full p-1 shrink-0 flex items-center justify-center h-6 w-6">
                    <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold truncate" title={client.name} style={{ color: '#e8ebf0', fontSize: '17px', lineHeight: '21.5px' }}>{client.name}</span>
            </div>
            
            {/* Spacer */}
            <div className="col-span-3" />

            {/* ROW 2 */}
            {/* Phone & WA */}
            <div className="flex items-center gap-1.5 h-[42px]">
                 <div className="bg-white px-3 h-full flex items-center gap-2 rounded-full flex-1 min-w-0" style={{ backgroundColor: '#6d898d', paddingRight: '12px' }}>
                    <PhoneCall className="w-4 h-4 text-slate-700 shrink-0" />
                    <span className="font-bold truncate" style={{ color: '#f0f1f3', fontSize: '14px', lineHeight: '20.5px', marginLeft: '0px', marginRight: '0px', paddingRight: '0px' }}>{client.phone}</span>
                </div>
                <button 
                    onClick={(e) => handleWhatsApp(e, client.phone)}
                    className="text-[#4bcd62] hover:text-[#3da750] transition-colors shrink-0 p-1 flex items-center justify-center outline-none"
                    title="Send WhatsApp"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </button>
            </div>

            {/* Middle Content Box (Spans 3 columns) */}
            <div className="col-span-3 bg-white border border-slate-200 shadow-sm rounded-[20px] p-4 flex flex-col items-center justify-center text-center w-full min-h-[64px]">
                {(!lastActivity || lastActivity.type !== 'follow_up') && (
                    <span className="font-bold text-slate-800 text-[15px]">
                        {lastActivity ? formatActivityName(lastActivity.type) : 'Client Created'}
                    </span>
                )}
                {lastActivity?.content && (
                    <span className="text-sm font-bold text-slate-700 mt-1.5 line-clamp-2">
                        {lastActivity.content}
                    </span>
                )}
            </div>

            {/* ROW 3 */}
            <div className="col-span-4 flex items-center gap-4 mt-6">
                {/* Source */}
                <div className="bg-[#6d898d] rounded-full flex items-center justify-center gap-2 px-4 font-bold text-[13px] h-[42px] flex-1 text-[#f4f8f8]" style={{ backgroundColor: '#6d898d', color: '#f4f8f8' }}>
                    <Globe className="w-4 h-4 shrink-0" />
                    <span className="truncate">{client.leadSource || 'Direct'}</span>
                </div>

                {/* Project */}
                <div className="bg-[#6d898d] px-3 flex items-center justify-center gap-2 rounded-full h-[42px] flex-1 text-[#f4eeee]" style={{ backgroundColor: '#6d898d', color: '#f4eeee' }}>
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="font-bold text-[13px] truncate">{client.projectName || 'No Project'}</span>
                </div>

                {/* Status */}
                <div className="bg-[#6d898d] rounded-full flex items-center justify-center px-4 font-bold text-[13px] truncate h-[42px] flex-1 text-[#edf0f5]" style={{ backgroundColor: '#6d898d', color: '#edf0f5' }}>
                    {client.status}
                </div>

                {/* Follow Up */}
                {client.followUpDate ? (
                    <div className="bg-[#6d898d] rounded-full flex items-center justify-center px-4 font-bold text-[#fdf9f9] text-[13px] h-[42px] flex-1 min-w-[150px]" style={{ backgroundColor: '#6d898d' }}>
                        <CalendarIcon className="w-4 h-4 mr-1.5 shrink-0" />
                        متابعة: {format(new Date(client.followUpDate), 'PP')}
                    </div>
                ) : (
                    <div className="flex-1 min-w-[150px]" />
                )}

                {/* Agent */}
                <div className="rounded-full flex items-center justify-center px-4 py-2 font-bold text-[13px] relative h-[42px] flex-[0.8] text-[#fdf9f9]" style={{ backgroundColor: '#6d898d' }}>
                    <span className="truncate pr-4">{usersMap[client.ownerId!] || client.salesAgent?.split(' ')[0] || 'Unknown'}</span>
                    {user?.role === 'super_admin' && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("حذف بيانات هذا العميل؟")) deleteClient(client.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-red-200 outline-none"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Mobile Flex Layout (Hidden on Desktop) */}
        <div className="flex lg:hidden flex-col gap-3">
             <div className="flex flex-wrap items-center gap-2">
                <div className="bg-white px-3 py-2 flex flex-1 items-center gap-2 rounded-full shrink-0" style={{ backgroundColor: '#6d898d' }}>
                    <div className="bg-[#6db5a4] rounded-full p-1 shrink-0 flex items-center justify-center h-5 w-5">
                        <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-bold text-xs truncate" style={{ color: '#ffffff' }}>{client.name}</span>
                </div>
             </div>

             <div className="flex items-center gap-2">
                 <div className="bg-white px-3 py-2 flex items-center gap-2 rounded-full flex-1" style={{ backgroundColor: '#6d898d' }}>
                    <PhoneCall className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="font-bold text-xs truncate" style={{ color: '#f3f4f7' }}>{client.phone}</span>
                </div>
                <button 
                    onClick={(e) => handleWhatsApp(e, client.phone)}
                    className="text-[#4bcd62] p-1 outline-none"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </button>
             </div>

             {client.followUpDate && (
                <div className="bg-[#e85e6c] rounded-full flex items-center justify-center px-4 py-2 font-bold text-white text-xs" style={{ backgroundColor: '#e85e6c' }}>
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-white" />
                    متابعة: {format(new Date(client.followUpDate), 'PP')}
                </div>
            )}

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-3 flex flex-col items-center justify-center text-center font-bold text-slate-800 text-sm mt-1">
                {(!lastActivity || lastActivity.type !== 'follow_up') && (
                    <span>{lastActivity ? formatActivityName(lastActivity.type) : 'Client Created'}</span>
                )}
                {lastActivity?.content && (
                    <span className="text-xs font-semibold text-slate-700 mt-1">{lastActivity.content}</span>
                )}
            </div>

             <div className="flex items-center justify-between gap-1.5 flex-wrap w-full mt-4">
                 <div className="bg-white px-2 py-2 flex-1 flex items-center justify-center gap-1 rounded-full min-w-[70px]" style={{ backgroundColor: '#6d898d' }}>
                    <Globe className="w-3 h-3 shrink-0" style={{ color: '#eff3f9' }} />
                    <span className="font-bold text-[9px] truncate" style={{ color: '#eff3f9' }}>{client.leadSource || 'Direct'}</span>
                </div>
                 <div className="bg-white flex-1 py-2 px-2 rounded-full flex items-center justify-center font-bold text-[9px] truncate min-w-[70px]" style={{ backgroundColor: '#6d898d', color: '#f1f9f9' }}>
                    {client.projectName || 'No Project'}
                 </div>
                 <div className="bg-white flex-1 py-2 px-2 rounded-full flex items-center justify-center font-bold text-[9px] truncate min-w-[70px]" style={{ backgroundColor: '#6d898d', color: '#f5f6f7' }}>
                    {client.status}
                 </div>
                 <div className="bg-[#f27878] text-white flex-1 py-2 px-2 rounded-full flex items-center justify-center font-bold text-[9px] relative min-w-[70px] shrink-0" style={{ backgroundColor: '#6d898d' }}>
                   <span className="truncate pr-3">{usersMap[client.ownerId!] || client.salesAgent?.split(' ')[0] || 'Unknown'}</span>
                   {user?.role === 'super_admin' && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("حذف بيانات هذا العميل؟")) deleteClient(client.id);
                            }}
                            className="absolute right-1 text-white outline-none"
                        >
                            <Trash2 className="w-2.5 h-2.5" />
                        </button>
                    )}
                 </div>
            </div>
        </div>
    </div>
  );
};

export const Clients: React.FC = () => {
  const { clients, addClient, updateClient, logQuickAction, deleteClient, addFollowUp, usersMap } = useData();
  const { user } = useAuth();
  
  const getInitialFilters = () => {
    try {
      const saved = sessionStorage.getItem('clientsFilterState');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  };

  const initialFilters = getInitialFilters();

  const [searchTerm, setSearchTerm] = useState(initialFilters?.searchTerm || '');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initialFilters?.selectedStatuses || []);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(initialFilters?.selectedProjects || []);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(initialFilters?.selectedUsers || []);
  const [followUpDateFrom, setFollowUpDateFrom] = useState(initialFilters?.followUpDateFrom || '');
  const [followUpDateTo, setFollowUpDateTo] = useState(initialFilters?.followUpDateTo || '');

  useEffect(() => {
    sessionStorage.setItem('clientsFilterState', JSON.stringify({
      searchTerm,
      selectedStatuses,
      selectedProjects,
      selectedUsers,
      followUpDateFrom,
      followUpDateTo
    }));
  }, [searchTerm, selectedStatuses, selectedProjects, selectedUsers, followUpDateFrom, followUpDateTo]);
  
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentStatePage] = useState(1);

  useEffect(() => {
    const pageFromUrl = searchParams.get('page');
    const parsedUrlPage = pageFromUrl ? parseInt(pageFromUrl, 10) : NaN;
    
    let initialPage = 1;
    
    if (!isNaN(parsedUrlPage) && parsedUrlPage > 0) {
      initialPage = parsedUrlPage;
    } else {
      const pageFromStorage = sessionStorage.getItem('clientsPage');
      const parsedStoragePage = pageFromStorage ? parseInt(pageFromStorage, 10) : NaN;
      if (!isNaN(parsedStoragePage) && parsedStoragePage > 0) {
        initialPage = parsedStoragePage;
      }
    }
    
    // console.log('Pagination initialized to:', initialPage);
    setCurrentStatePage(initialPage);
    
    if (initialPage !== parsedUrlPage) {
      setSearchParams(prev => {
        prev.set('page', initialPage.toString());
        return prev;
      }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrentPage = (newPage: number | ((prev: number) => number)) => {
    const next = typeof newPage === 'function' ? newPage(currentPage) : newPage;
    setCurrentStatePage(next);
    sessionStorage.setItem('clientsPage', next.toString());
    setSearchParams(params => {
      params.set('page', next.toString());
      return params;
    });
  };

  const ITEMS_PER_PAGE = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

  const [followUpClient, setFollowUpClient] = useState<Client | null>(null);
  const [fuType, setFuType] = useState('Call Attempt');
  const [fuFeedback, setFuFeedback] = useState('');
  const [fuStatus, setFuStatus] = useState<ClientStatus>('My Fresh Lead');
  const [fuNextAction, setFuNextAction] = useState('');
  const [fuNextDate, setFuNextDate] = useState('');

  const handleAddFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpClient) return;
    
    addFollowUp(followUpClient.id, {
      followUpType: fuType,
      feedbackText: fuFeedback,
      status: fuStatus,
      nextAction: fuNextAction,
      nextFollowUpDate: (fuStatus === 'Not Interested' || fuStatus === 'Low Budget') ? '' : fuNextDate
    });
    setFollowUpClient(null);
    setFuFeedback('');
    setFuNextAction('');
    setFuNextDate('');
  };

  // Extract unique projects for the filter dropdown with normalization
  const projectMap = new Map<string, string>();
  clients.forEach(c => {
    if (c.projectName) {
      const normalized = c.projectName.trim().replace(/\s+/g, ' ').toLowerCase();
      if (!projectMap.has(normalized)) {
        projectMap.set(normalized, c.projectName);
      }
    }
  });
  const uniqueProjects = Array.from(projectMap.values());
  
  // Extract unique users (agents) for the filter dropdown
  const uniqueUsers = Array.from(new Set(clients.map(c => c.ownerId || c.salesAgent).filter(Boolean)));

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.phone || '').includes(searchTerm);
    
    // Handle 'Fresh Lead' map to 'My Fresh Lead'
    const matchesStatus = selectedStatuses.length > 0 ? selectedStatuses.some(status => (status === 'Fresh Lead' && c.status === 'My Fresh Lead') || c.status === status) : true;
    
    const matchesProject = selectedProjects.length > 0 ? selectedProjects.some(sp => {
       const normSP = sp.trim().replace(/\s+/g, ' ').toLowerCase();
       const normC = (c.projectName || '').trim().replace(/\s+/g, ' ').toLowerCase();
       return normSP === normC;
    }) : true;
    
    const matchesUser = selectedUsers.length > 0 ? (selectedUsers.includes(c.ownerId || '') || selectedUsers.includes(c.salesAgent || '')) : true;

    let matchesDateRange = true;
    if (followUpDateFrom || followUpDateTo) {
      if (c.followUpDate) {
        const d = new Date(c.followUpDate);
        if (followUpDateFrom) {
          const from = new Date(followUpDateFrom);
          from.setHours(0, 0, 0, 0);
          if (d < from) matchesDateRange = false;
        }
        if (followUpDateTo && matchesDateRange) {
           const to = new Date(followUpDateTo);
           to.setHours(23, 59, 59, 999);
           if (d > to) matchesDateRange = false;
        }
      } else {
        matchesDateRange = false;
      }
    }

    return matchesSearch && matchesStatus && matchesProject && matchesUser && matchesDateRange;
  }).sort((a,b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
            <p className="text-slate-500 text-sm mt-1">Manage all your contacts list.</p>
          </div>
          
          {user?.role !== 'sales' && (
            <button 
              onClick={openAdd}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Client
            </button>
          )}
        </div>

        {/* Filters Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
          {/* Main Search Row */}
          <div className="flex items-center w-full relative">
             <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
             <input 
               type="text" 
               placeholder="Search by name, phone..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-11 pr-4 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
             />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 w-full pb-2 sm:pb-0">
              {/* Date Filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 hover:border-slate-300 transition-colors shrink-0 h-[42px]" style={{ width: '200px', fontSize: '0px', lineHeight: '0px', textAlign: 'left', fontWeight: 'normal', paddingLeft: '0px', paddingRight: '0px', paddingBottom: '8px', marginLeft: '18px', borderRadius: '11px', marginRight: '13px' }}>
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                <div className="flex items-center">
                  <input 
                      type="date"
                      value={followUpDateFrom}
                      onChange={e => setFollowUpDateFrom(e.target.value)}
                      className="bg-transparent focus:outline-none text-slate-700"
                      title="From Date"
                      style={{ fontSize: '26px', lineHeight: '0px', textAlign: 'left', marginLeft: '0px', width: '50px', marginRight: '-2px', marginTop: '0px', marginBottom: '0px', paddingLeft: '0px', paddingRight: '8px' }}
                  />
                  <span className="text-slate-300 font-bold mx-1">-</span>
                  <input 
                      type="date"
                      value={followUpDateTo}
                      onChange={e => setFollowUpDateTo(e.target.value)}
                      className="bg-transparent focus:outline-none text-slate-700"
                      title="To Date"
                      style={{ fontSize: '26px', lineHeight: '-1px', textAlign: 'left', fontWeight: 'normal', width: '50px', height: '29.9907px', marginLeft: '48px' }}
                  />
                </div>
              </div>

              {/* Status Dropdown */}
              <div className="relative shrink-0 flex-1 sm:flex-none">
                <button 
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="w-full sm:w-40 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-left flex items-center justify-between hover:bg-white hover:border-slate-300 transition-colors font-medium text-slate-800 h-[42px]"
                  style={{ marginRight: '23px' }}
                >
                  <span className="truncate">{selectedStatuses.length === 0 ? 'All Statuses' : `${selectedStatuses.length} Statuses`}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>
                {isStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsStatusOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto py-2">
                      <label className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={selectedStatuses.length === 0} onChange={() => setSelectedStatuses([])} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-3 text-sm text-slate-700 font-medium">All Statuses</span>
                      </label>
                      <div className="px-4 py-2 border-t border-slate-100 my-1"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Statuses</span></div>
                      {FILTER_STATUSES.map(status => {
                        const isSelected = selectedStatuses.includes(status);
                        return (
                          <label key={status} className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={(e) => {
                                if(e.target.checked) setSelectedStatuses([...selectedStatuses, status]);
                                else setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0" 
                            />
                            <span className="ml-3 text-sm text-slate-700">{status}</span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Projects Dropdown */}
              <div className="relative shrink-0 flex-1 sm:flex-none">
                <button 
                  onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                  className="w-full sm:w-40 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-left flex items-center justify-between hover:bg-white hover:border-slate-300 transition-colors font-medium text-slate-800 h-[42px]"
                  style={{ marginRight: '20px' }}
                >
                  <span className="truncate">{selectedProjects.length === 0 ? 'All Projects' : `${selectedProjects.length} Projects`}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>
                {isProjectsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProjectsOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto py-2">
                      <label className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={selectedProjects.length === 0} onChange={() => setSelectedProjects([])} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-3 text-sm text-slate-700 font-medium">All Projects</span>
                      </label>
                      <div className="px-4 py-2 border-t border-slate-100 my-1"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projects</span></div>
                      {uniqueProjects.map(proj => {
                        const pName = proj || 'No Project';
                        const isSelected = selectedProjects.includes(pName);
                        return (
                          <label key={pName} className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={(e) => {
                                if(e.target.checked) setSelectedProjects([...selectedProjects, pName]);
                                else setSelectedProjects(selectedProjects.filter(x => x !== pName));
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0" 
                            />
                            <span className={`ml-3 text-sm ${isSelected ? 'font-medium text-slate-900' : 'text-slate-700'} truncate`} title={pName}>{pName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Users Dropdown (Admin/Manager only) */}
              {(user?.role === 'super_admin' || user?.role === 'manager') && (
                <div className="relative shrink-0 flex-1 sm:flex-none">
                  <button 
                    onClick={() => setIsUsersOpen(!isUsersOpen)}
                    className="w-full sm:w-40 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-left flex items-center justify-between hover:bg-white hover:border-slate-300 transition-colors font-medium text-slate-800 h-[42px]"
                  >
                    <span className="truncate">{selectedUsers.length === 0 ? 'All Agents' : `${selectedUsers.length} Agents`}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </button>
                  {isUsersOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsUsersOpen(false)}></div>
                      <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto py-2">
                        <label className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer">
                          <input type="checkbox" checked={selectedUsers.length === 0} onChange={() => setSelectedUsers([])} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                          <span className="ml-3 text-sm text-slate-700 font-medium">All Agents</span>
                        </label>
                        <div className="px-4 py-2 border-t border-slate-100 my-1"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agents</span></div>
                        {uniqueUsers.map(u => {
                          const uName = usersMap[u] || u;
                          const isSelected = selectedUsers.includes(u);
                          return (
                            <label key={u} className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={(e) => {
                                  if(e.target.checked) setSelectedUsers([...selectedUsers, u]);
                                  else setSelectedUsers(selectedUsers.filter(x => x !== u));
                                }}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0" 
                              />
                              <span className="ml-3 text-sm text-slate-700 truncate" title={uName}>{uName}</span>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Reset Button */}
              {(selectedStatuses.length > 0 || selectedProjects.length > 0 || selectedUsers.length > 0 || followUpDateFrom || followUpDateTo || searchTerm) && (
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedStatuses([]);
                      setSelectedProjects([]);
                      setSelectedUsers([]);
                      setFollowUpDateFrom('');
                      setFollowUpDateTo('');
                    }}
                    className="flex justify-center items-center px-4 py-2 bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 rounded-xl text-sm font-medium transition-colors shrink-0 ml-auto h-[42px]"
                    title="Reset Filters"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reset
                  </button>
              )}
          </div>
        </div>
      </div>

      {/* Main Content: Vertical Client List */}
      <div className="bg-[#bcc1ca] rounded-3xl border border-slate-200 p-4 sm:p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
           <h2 className="font-bold text-slate-800">
             Showing {filteredClients.length} {filteredClients.length === 1 ? 'Client' : 'Clients'}
           </h2>
        </div>
        
        <div className="flex flex-col gap-3 pb-6">
          {paginatedClients.map((client) => (
             <ClientCard key={client.id} client={client} logQuickAction={logQuickAction} user={user} deleteClient={deleteClient} usersMap={usersMap} onOpenFollowUp={(c) => {
                 setFollowUpClient(c);
                 setFuStatus(c.status);
             }} />
          ))}
        </div>
        
        {paginatedClients.length === 0 && (
          <div className="py-20 text-center text-slate-500 border-2 border-dashed border-slate-400/50 rounded-2xl bg-[#c9d4d4]/30">
             There are no clients matching your filters.
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-auto pt-6 pb-2 flex items-center justify-center gap-4">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1 px-3 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-2 mx-2">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                // Simple logic to show current, first, last, and neighbors (max 5 pages shown)
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-lg font-bold transition-all ${
                        currentPage === pageNum 
                          ? 'text-slate-800 border-b-2 border-slate-800' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className="text-slate-400 mx-1 text-lg">...</span>;
                }
                return null;
              })}
            </div>

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1 px-3 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
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

      <Modal isOpen={!!followUpClient} onClose={() => setFollowUpClient(null)} title="Add Follow Up">
        <form onSubmit={handleAddFollowUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={fuType}
                onChange={(e) => setFuType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
              >
                <option>Call Attempt</option>
                <option>Phone Call</option>
                <option>WhatsApp Message</option>
                <option>Email Sent</option>
                <option>Meeting</option>
                <option>Site Visit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Status</label>
              <select
                value={fuStatus}
                onChange={(e) => setFuStatus(e.target.value as ClientStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
              >
                {ALL_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Feedback / Notes</label>
            <textarea
              required
              value={fuFeedback}
              onChange={(e) => setFuFeedback(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm resize-none"
              rows={3}
              placeholder="What happened during this follow up?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Next Action (Optional)</label>
              <input
                type="text"
                value={fuNextAction}
                onChange={(e) => setFuNextAction(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm"
                placeholder="e.g. Send proposal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Next Follow Up Date</label>
              <input
                type="date"
                value={(fuStatus === 'Not Interested' || fuStatus === 'Low Budget') ? '' : fuNextDate}
                onChange={(e) => setFuNextDate(e.target.value)}
                disabled={fuStatus === 'Not Interested' || fuStatus === 'Low Budget'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm disabled:opacity-50 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setFollowUpClient(null)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Save Follow Up
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
